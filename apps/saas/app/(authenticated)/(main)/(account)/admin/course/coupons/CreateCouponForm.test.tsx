// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
	}),
}));

import { CreateCouponForm } from "./CreateCouponForm";

describe("CreateCouponForm", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
		global.fetch = vi.fn();
	});

	afterEach(() => {
		act(() => root.unmount());
		container.remove();
		vi.restoreAllMocks();
	});

	it("送出時打 JSON body 到 /api/coupons，不是舊的 HTML form POST（Task: 優惠券建立修復）", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ success: true }),
		});

		await act(async () => {
			root.render(<CreateCouponForm />);
		});

		const codeInput = container.querySelector('input[name="code"]') as HTMLInputElement;
		const amountInput = container.querySelector('input[name="amountOff"]') as HTMLInputElement;
		codeInput.value = "TESTSOP01";
		amountInput.value = "50";
		codeInput.dispatchEvent(new Event("input", { bubbles: true }));
		amountInput.dispatchEvent(new Event("input", { bubbles: true }));

		const form = container.querySelector("form") as HTMLFormElement;
		await act(async () => {
			form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/coupons",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({ "Content-Type": "application/json" }),
				body: expect.any(String),
			}),
		);
		const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		const parsedBody = JSON.parse(call[1].body);
		expect(parsedBody.code).toBe("TESTSOP01");
		expect(parsedBody.amountOff).toBe(50);
	});

	it("API 回傳錯誤時顯示錯誤訊息，不會靜默失敗", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: false,
			status: 400,
			json: async () => ({ error: "invalid" }),
		});

		await act(async () => {
			root.render(<CreateCouponForm />);
		});

		const codeInput = container.querySelector('input[name="code"]') as HTMLInputElement;
		codeInput.value = "X";
		codeInput.dispatchEvent(new Event("input", { bubbles: true }));

		const form = container.querySelector("form") as HTMLFormElement;
		await act(async () => {
			form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
		});

		expect(container.textContent).toContain("invalid");
	});
});
