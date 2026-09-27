// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KitClaimButton } from "./KitClaimButton";

const roots = new Set<Root>();

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
		act(() => root.unmount());
	}
	roots.clear();
	document.body.innerHTML = "";
});

describe("KitClaimButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("點擊按鈕呼叫 POST /api/github/claim 且發送成功訊息", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				ok: true,
				message: "已從模板建立專屬倉庫並送出 GitHub 邀請（write）。",
			}),
		});
		global.fetch = mockFetch;

		const container = await render(<KitClaimButton />);

		const button = container.querySelector('[data-testid="kit-claim-button"]') as HTMLButtonElement;
		expect(button).not.toBeNull();
		expect(button.textContent).toBe("領取代碼包");

		await act(async () => {
			button.click();
		});

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/github/claim",
			expect.objectContaining({ method: "POST" }),
		);
		expect(container.textContent).toContain("已從模板建立專屬倉庫並送出 GitHub 邀請（write）。");
	});

	it("呼叫失敗時顯示錯誤訊息", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 403,
			json: async () => ({
				error: "not_eligible",
			}),
		});
		global.fetch = mockFetch;

		const container = await render(<KitClaimButton />);

		const button = container.querySelector('[data-testid="kit-claim-button"]') as HTMLButtonElement;

		await act(async () => {
			button.click();
		});

		expect(container.textContent).toContain("not_eligible");
	});
});

