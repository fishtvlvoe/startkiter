// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@webcontainer/api", () => ({
	WebContainer: {
		boot: vi.fn(),
	},
}));

import { WebContainer } from "@webcontainer/api";
import { resetWebContainerCache } from "../../webcontainer/client";
import { WebContainerSandbox } from "./WebContainerSandbox";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

const roots = new Set<Root>();

function createProcess(exitCode: number, output = "") {
	return {
		exit: Promise.resolve(exitCode),
		output: {
			pipeTo: async (writable: WritableStream<string>) => {
				if (output) {
					const writer = writable.getWriter();
					await writer.write(output);
					await writer.close();
				}
			},
		},
	};
}

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.add(root);

	await act(async () => {
		root.render(element);
	});

	return container;
}

afterEach(() => {
	for (const root of roots) {
		root.unmount();
	}
	roots.clear();
	document.body.replaceChildren();
	resetWebContainerCache();
	vi.clearAllMocks();
});

beforeEach(() => {
	Object.defineProperty(window, "crossOriginIsolated", {
		configurable: true,
		value: true,
	});
});

describe("WebContainerSandbox", () => {
	it("測試通過時先停頓 150ms，再顯示獎勵回饋", async () => {
		const spawn = vi.fn().mockResolvedValue(createProcess(0));
		vi.mocked(WebContainer.boot).mockResolvedValue({
			mount: vi.fn().mockResolvedValue(undefined),
			spawn,
		} as never);
		const container = await render(
			<WebContainerSandbox blockId="pass-01" files={{}} hints={[]} />,
		);

		await act(async () => {
			container.querySelector<HTMLButtonElement>("button")?.click();
			await Promise.resolve();
		});

		expect(container.textContent).toContain("判定中");
		expect(container.textContent).not.toContain("挑戰完成");

		await new Promise((resolve) => setTimeout(resolve, 160));
		expect(container.textContent).toContain("挑戰完成");
		expect(spawn).toHaveBeenCalled();
	});

	it("測試失敗時顯示敘事化提示，不顯示原始 stack trace", async () => {
		vi.mocked(WebContainer.boot).mockResolvedValue({
			mount: vi.fn().mockResolvedValue(undefined),
			spawn: vi.fn().mockResolvedValue(
				createProcess(1, "SyntaxError: Unexpected token\n at test.js:1:1"),
			),
		} as never);
		const container = await render(
			<WebContainerSandbox blockId="fail-01" files={{}} hints={["先檢查括號"]} />,
		);

		await act(async () => {
			container.querySelector<HTMLButtonElement>("button")?.click();
			await Promise.resolve();
		});
		await act(async () => {
			await Promise.resolve();
		});

		expect(container.textContent).toContain("語法錯誤提示");
		expect(container.textContent).not.toContain("SyntaxError: Unexpected token");
		expect(container.textContent).not.toContain("at test.js:1:1");
	});

	it("未啟用 crossOriginIsolated 時顯示不支援訊息且不 boot", async () => {
		Object.defineProperty(window, "crossOriginIsolated", {
			configurable: true,
			value: false,
		});
		const container = await render(
			<WebContainerSandbox blockId="unsupported-01" files={{}} hints={[]} />,
		);

		expect(container.textContent).toContain("此瀏覽器不支援程式碼沙盒");
		expect(WebContainer.boot).not.toHaveBeenCalled();
	});

	it("同一個 block 重複執行只 boot 一次，但每次重新 mount 檔案", async () => {
		const mount = vi.fn().mockResolvedValue(undefined);
		const spawn = vi.fn().mockResolvedValue(createProcess(0));
		vi.mocked(WebContainer.boot).mockResolvedValue({ mount, spawn } as never);
		const container = await render(
			<WebContainerSandbox blockId="repeat-01" files={{ "index.js": "console.log(1)" }} hints={[]} />,
		);

		await act(async () => {
			container.querySelector<HTMLButtonElement>("button")?.click();
			await Promise.resolve();
		});
		await new Promise((resolve) => setTimeout(resolve, 160));
		await act(async () => {
			container.querySelector<HTMLButtonElement>("button")?.click();
			await Promise.resolve();
		});

		expect(WebContainer.boot).toHaveBeenCalledTimes(1);
		expect(mount).toHaveBeenCalledTimes(2);
		expect(spawn).toHaveBeenCalledTimes(2);
	});

	it("兩個 sandbox 並行執行時共用同一個 WebContainer instance", async () => {
		const mount = vi.fn().mockResolvedValue(undefined);
		const spawn = vi.fn().mockResolvedValue(createProcess(0));
		vi.mocked(WebContainer.boot).mockResolvedValue({ mount, spawn } as never);
		const container = await render(
			<>
				<WebContainerSandbox blockId="parallel-01" files={{}} hints={[]} />
				<WebContainerSandbox blockId="parallel-02" files={{}} hints={[]} />
			</>,
		);

		await act(async () => {
			for (const button of container.querySelectorAll<HTMLButtonElement>("button")) {
				button.click();
			}
			await Promise.resolve();
		});

		expect(WebContainer.boot).toHaveBeenCalledTimes(1);
		expect(mount).toHaveBeenCalledTimes(2);
	});
});
