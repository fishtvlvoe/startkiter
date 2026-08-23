import type { FileSystemTree, WebContainer } from "@webcontainer/api";

type SandboxProcess = {
	exit: Promise<number>;
	output: ReadableStream<string>;
	kill: () => void;
};

export type SandboxRunResult = {
	status: "pass" | "fail";
	testOutput: string;
};

export const SANDBOX_TIMEOUT_MS = 30_000;
export const MAX_SANDBOX_FILES = 50;
export const MAX_SANDBOX_TOTAL_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_SANDBOX_OUTPUT_LINE_BYTES = 500 * 1024;

const ALLOWED_TEST_COMMANDS = new Set(["node", "npm"]);
const FORBIDDEN_COMMAND_ARGUMENTS = /[;&|`$()<>]/;

class SandboxTimeoutError extends Error {
	constructor() {
		super("沙盒執行逾時。");
		this.name = "SandboxTimeoutError";
	}
}

function byteLength(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

function validateFiles(files: Record<string, string>) {
	const entries = Object.entries(files);
	if (entries.length > MAX_SANDBOX_FILES) {
		throw new Error(`沙盒最多允許 ${MAX_SANDBOX_FILES} 個檔案。`);
	}

	let totalBytes = 0;
	for (const [filePath, contents] of entries) {
		if (typeof contents !== "string") {
			throw new Error("沙盒檔案內容必須是文字。");
		}

		totalBytes += byteLength(contents);
		if (totalBytes > MAX_SANDBOX_TOTAL_FILE_BYTES) {
			throw new Error("沙盒檔案總大小不可超過 10MB。");
		}

		if (filePath.startsWith("/") || filePath.includes("\\")) {
			throw new Error("沙盒檔案路徑不合法。");
		}
	}
}

function addFile(tree: FileSystemTree, filePath: string, contents: string) {
	const parts = filePath.split("/").filter(Boolean);
	if (parts.length === 0 || parts.some((part) => part === "." || part === "..")) {
		throw new Error("沙盒檔案路徑不合法。");
	}

	let current = tree;
	for (const part of parts.slice(0, -1)) {
		const existing = current[part];
		if (existing && "directory" in existing) {
			current = existing.directory;
			continue;
		}

		const directory: FileSystemTree = {};
		current[part] = { directory };
		current = directory;
	}

	const name = parts[parts.length - 1];
	if (!name) {
		throw new Error("沙盒檔案路徑不合法。");
	}
	current[name] = { file: { contents } };
}

export function toFileSystemTree(files: Record<string, string>): FileSystemTree {
	validateFiles(files);

	const tree: FileSystemTree = {};
	for (const [filePath, contents] of Object.entries(files)) {
		addFile(tree, filePath, contents);
	}
	return tree;
}

function commandParts(command: string): [string, string[]] {
	const parts = command.trim().split(/\s+/).filter(Boolean);
	return [parts[0] ?? "", parts.slice(1)];
}

function validateTestCommand(command: string, args: string[]) {
	const executable = command.split("/").pop() ?? "";
	if (!ALLOWED_TEST_COMMANDS.has(executable)) {
		throw new Error("沙盒只允許執行 Node.js 測試命令。");
	}

	if (args.some((argument) => FORBIDDEN_COMMAND_ARGUMENTS.test(argument))) {
		throw new Error("沙盒命令含有不允許的 shell 字元。");
	}

	if (
		executable === "node" &&
		(args.length === 0 || args.some((argument) => argument === "-e" || argument === "--eval"))
	) {
		throw new Error("沙盒 Node.js 命令必須執行檔案，不允許 inline 程式碼。");
	}

	if (executable === "npm") {
		const [subcommand, scriptName] = args;
		const isTestCommand =
			subcommand === "test" ||
			(subcommand === "run" && typeof scriptName === "string" && /^[a-zA-Z0-9:_-]+$/.test(scriptName));
		if (!isTestCommand) {
			throw new Error("沙盒 npm 只允許執行 npm test 或 npm run <script>。");
		}
	}
}

type CollectedOutput = {
	text: string;
	exceededLineLimit: boolean;
};

async function collectOutput(process: SandboxProcess): Promise<CollectedOutput> {
	const chunks: string[] = [];
	let currentLineBytes = 0;
	let exceededLineLimit = false;

	const outputPromise = process.output.pipeTo(
		new WritableStream<string | Uint8Array>({
			write(chunk) {
				if (exceededLineLimit) {
					return;
				}

				const text = typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
				const lines = text.split("\n");
				for (const [index, line] of lines.entries()) {
					currentLineBytes += byteLength(line);
					if (currentLineBytes > MAX_SANDBOX_OUTPUT_LINE_BYTES) {
						exceededLineLimit = true;
						return;
					}
					if (index < lines.length - 1) {
						currentLineBytes = 0;
					}
				}
				chunks.push(text);
			},
		}),
	);

	await outputPromise.catch(() => undefined);
	return {
		text: chunks.join(""),
		exceededLineLimit,
	};
}

async function withSandboxTimeout<T>(
	operation: (signal: AbortSignal) => Promise<T>,
	onTimeout?: () => void,
): Promise<T> {
	const controller = new AbortController();
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	let timedOut = false;

	const operationPromise = Promise.resolve().then(() => operation(controller.signal));
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			timedOut = true;
			controller.abort();
			onTimeout?.();
			reject(new SandboxTimeoutError());
		}, SANDBOX_TIMEOUT_MS);
	});

	try {
		return await Promise.race([operationPromise, timeoutPromise]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		if (timedOut) {
			controller.abort();
		}
	}
}

async function spawnProcess(
	webcontainer: WebContainer,
	command: string,
	args: string[],
): Promise<SandboxProcess> {
	let process: SandboxProcess | undefined;
	return withSandboxTimeout(
		async (signal) => {
			const spawned = (await webcontainer.spawn(command, args)) as SandboxProcess;
			if (signal.aborted) {
				spawned.kill();
				throw new SandboxTimeoutError();
			}
			process = spawned;
			return spawned;
		},
		() => process?.kill(),
	);
}

async function runProcess(
	webcontainer: WebContainer,
	command: string,
	args: string[],
): Promise<SandboxRunResult> {
	let process: SandboxProcess | undefined;
	try {
		process = await spawnProcess(webcontainer, command, args);
		const outputPromise = collectOutput(process);
		const { exitCode, output } = await withSandboxTimeout(
			async () => {
				const [exitCode, output] = await Promise.all([process!.exit, outputPromise]);
				return { exitCode, output };
			},
			() => process?.kill(),
		);

		if (output.exceededLineLimit) {
			process?.kill();
			return { status: "fail", testOutput: "輸出超過單行 500KB 限制。" };
		}

		return {
			status: exitCode === 0 ? "pass" : "fail",
			testOutput: output.text,
		};
	} catch (error) {
		if (error instanceof SandboxTimeoutError) {
			process?.kill();
			return { status: "fail", testOutput: "執行逾時。" };
		}
		throw error;
	}
}

export async function runSandboxTests(
	webcontainer: WebContainer,
	files: Record<string, string>,
	testCommand = "npm test",
): Promise<SandboxRunResult> {
	try {
		const [command, args] = commandParts(testCommand);
		validateTestCommand(command, args);
		const tree = toFileSystemTree(files);

		await withSandboxTimeout(async (signal) => {
			if (signal.aborted) {
				throw new SandboxTimeoutError();
			}
			await webcontainer.mount(tree);
		});

		if (files["package.json"]) {
			const installResult = await runProcess(webcontainer, "npm", [
				"install",
				"--ignore-scripts",
				"--no-audit",
				"--no-fund",
			]);
			if (installResult.status === "fail") {
				return installResult;
			}
		}

		return runProcess(webcontainer, command, args);
	} catch (error) {
		if (error instanceof SandboxTimeoutError) {
			return { status: "fail", testOutput: "沙盒檔案掛載逾時。" };
		}
		return {
			status: "fail",
			testOutput: error instanceof Error ? error.message : "沙盒資源限制被拒絕。",
		};
	}
}

export function narrativeHintForOutput(testOutput: string): string {
	if (/SyntaxError/i.test(testOutput)) {
		return "語法錯誤提示：先檢查括號、引號與關鍵字。";
	}

	if (/AssertionError|expect\(.*\)\.toBe/i.test(testOutput)) {
		return "測試斷言失敗提示：把預期結果和實際結果逐一比對。";
	}

	if (/逾時|timeout|timed out/i.test(testOutput)) {
		return "執行逾時提示：把問題拆小，先確認每一步都能結束。";
	}

	return "通用鼓勵文字：再試一次，先觀察程式每一步的結果。";
}
