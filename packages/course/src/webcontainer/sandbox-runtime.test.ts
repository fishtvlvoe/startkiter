import { describe, expect, it, vi } from "vitest";

import {
	MAX_SANDBOX_FILES,
	MAX_SANDBOX_OUTPUT_LINE_BYTES,
	MAX_SANDBOX_TOTAL_FILE_BYTES,
	narrativeHintForOutput,
	runSandboxTests,
	toFileSystemTree,
} from "./sandbox-runtime";

function processWith(exitCode: number, output: string) {
	return {
		exit: Promise.resolve(exitCode),
		output: new ReadableStream<string>({
			start(controller) {
				controller.enqueue(output);
				controller.close();
			},
		}),
		kill: vi.fn(),
	};
}

describe("sandbox-runtime", () => {
	it("把平面檔案路徑轉成 WebContainer FileSystemTree", () => {
		expect(toFileSystemTree({ "src/index.js": "console.log(1)" })).toEqual({
			src: {
				directory: {
					"index.js": { file: { contents: "console.log(1)" } },
				},
			},
		});
	});

	it("先安裝依賴，再執行自訂測試指令並回傳 pass", async () => {
		const spawn = vi
			.fn()
			.mockResolvedValueOnce(processWith(0, "installed"))
			.mockResolvedValueOnce(processWith(0, "passed"));
		const webcontainer = {
			mount: vi.fn().mockResolvedValue(undefined),
			spawn,
		} as never;

		expect(
			await runSandboxTests(
				webcontainer,
				{ "package.json": "{}", "test.js": "console.log('ok')" },
				"node test.js",
			),
		).toEqual({ status: "pass", testOutput: "passed" });
		expect(spawn).toHaveBeenNthCalledWith(1, "npm", [
			"install",
			"--ignore-scripts",
			"--no-audit",
			"--no-fund",
		]);
		expect(spawn).toHaveBeenNthCalledWith(2, "node", ["test.js"]);
	});

	it("拒絕超過檔案數與總大小限制的輸入", () => {
		expect(() =>
			toFileSystemTree(
				Object.fromEntries(
					Array.from({ length: MAX_SANDBOX_FILES + 1 }, (_, index) => [`file-${index}.js`, ""]),
				),
			),
		).toThrow("最多允許");

		expect(() =>
			toFileSystemTree({
				"large-file.js": "x".repeat(MAX_SANDBOX_TOTAL_FILE_BYTES + 1),
			}),
		).toThrow("10MB");
	});

	it("拒絕不允許的執行命令與超長單行輸出", async () => {
		const mount = vi.fn().mockResolvedValue(undefined);
		const spawn = vi.fn().mockResolvedValue(
			processWith(0, "x".repeat(MAX_SANDBOX_OUTPUT_LINE_BYTES + 1)),
		);
		const webcontainer = { mount, spawn } as never;

		await expect(runSandboxTests(webcontainer, {}, "rm -rf .")).resolves.toEqual({
			status: "fail",
			testOutput: expect.stringContaining("只允許"),
		});
		expect(mount).not.toHaveBeenCalled();

		await expect(runSandboxTests(webcontainer, {}, "node test.js")).resolves.toEqual({
			status: "fail",
			testOutput: expect.stringContaining("500KB"),
		});
		expect(spawn).toHaveBeenCalledWith("node", ["test.js"]);
	});

	it.each([
		["SyntaxError: bad syntax", "語法錯誤提示"],
		["AssertionError: expected 1 to be 2", "測試斷言失敗提示"],
		["沙盒檔案掛載逾時", "執行逾時提示"],
		["unknown failure", "通用鼓勵文字"],
	])("將測試輸出分類成敘事提示：%s", (output, expected) => {
		expect(narrativeHintForOutput(output)).toContain(expected);
	});
});
