import { describe, expect, it, vi } from "vitest";

import { narrativeHintForOutput, runSandboxTests, toFileSystemTree } from "./sandbox-runtime";

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
		expect(spawn).toHaveBeenNthCalledWith(1, "npm", ["install"]);
		expect(spawn).toHaveBeenNthCalledWith(2, "node", ["test.js"]);
	});

	it.each([
		["SyntaxError: bad syntax", "語法錯誤提示"],
		["AssertionError: expected 1 to be 2", "測試斷言失敗提示"],
		["執行逾時", "執行逾時提示"],
		["unknown failure", "通用鼓勵文字"],
	])("將測試輸出分類成敘事提示：%s", (output, expected) => {
		expect(narrativeHintForOutput(output)).toContain(expected);
	});
});
