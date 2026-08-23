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

const SANDBOX_TIMEOUT_MS = 30_000;

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
	const tree: FileSystemTree = {};
	for (const [filePath, contents] of Object.entries(files)) {
		addFile(tree, filePath, contents);
	}
	return tree;
}

function commandParts(command: string): [string, string[]] {
	const parts = command.trim().split(/\s+/).filter(Boolean);
	return [parts[0] ?? "npm", parts.slice(1)];
}

async function collectOutput(process: SandboxProcess): Promise<string> {
	const chunks: string[] = [];
	const outputPromise = process.output.pipeTo(
		new WritableStream<string | Uint8Array>({
			write(chunk) {
				chunks.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
			},
		}),
	);

	await outputPromise.catch(() => undefined);
	return chunks.join("");
}

async function runProcess(
	webcontainer: WebContainer,
	command: string,
	args: string[],
): Promise<SandboxRunResult> {
	const process = await webcontainer.spawn(command, args);
	const outputPromise = collectOutput(process);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<"timeout">((resolve) => {
		timeoutId = setTimeout(() => resolve("timeout"), SANDBOX_TIMEOUT_MS);
	});
	const exit = await Promise.race([process.exit, timeout]);
	if (timeoutId) {
		clearTimeout(timeoutId);
	}

	if (exit === "timeout") {
		process.kill();
	}

	const testOutput = await outputPromise;
	if (exit === "timeout") {
		return { status: "fail", testOutput: `${testOutput}\n執行逾時` };
	}

	return { status: exit === 0 ? "pass" : "fail", testOutput };
}

export async function runSandboxTests(
	webcontainer: WebContainer,
	files: Record<string, string>,
	testCommand = "npm test",
): Promise<SandboxRunResult> {
	await webcontainer.mount(toFileSystemTree(files));

	if (files["package.json"]) {
		const installResult = await runProcess(webcontainer, "npm", ["install"]);
		if (installResult.status === "fail") {
			return installResult;
		}
	}

	const [command, args] = commandParts(testCommand);
	return runProcess(webcontainer, command, args);
}

export function narrativeHintForOutput(testOutput: string): string {
	if (/SyntaxError/i.test(testOutput)) {
		return "語法錯誤提示：先檢查括號、引號與關鍵字。";
	}

	if (/AssertionError|expect\(.*\)\.toBe/i.test(testOutput)) {
		return "測試斷言失敗提示：把預期結果和實際結果逐一比對。";
	}

	if (/執行逾時|timeout|timed out/i.test(testOutput)) {
		return "執行逾時提示：把問題拆小，先確認每一步都能結束。";
	}

	return "通用鼓勵文字：再試一次，先觀察程式每一步的結果。";
}
