// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: pushMock,
		replace: vi.fn(),
		refresh: vi.fn(),
	}),
}));

vi.mock("@payments/components/InvoicePreferenceFields", () => ({
	DEFAULT_INVOICE_PREFERENCE: {
		invoiceType: "PERSONAL",
		carrierType: "member",
		carrierId: "",
		taxId: "",
		title: "",
		address: "",
		loveCode: "",
	},
	InvoicePreferenceFields: () => <div data-testid="invoice-preference-fields" />,
}));

vi.mock("@startkiter/ui", () => ({
	Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

import { CheckoutButton } from "./checkout-button";

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

describe("CheckoutButton product prop", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({
					orderNo: "ORD-1",
					payment: { type: "redirect", checkoutUrl: "https://pay.example/checkout" },
				}),
			}),
		);
		vi.stubGlobal("location", { assign: vi.fn() });
	});

	afterEach(() => {
		for (const root of roots) root.unmount();
		roots.clear();
		document.body.replaceChildren();
		vi.unstubAllGlobals();
	});

	it("sends the product.productId to /api/checkout instead of a hard-coded MVP sku", async () => {
		const container = await render(
			<CheckoutButton
				product={{ productId: "combo-a", title: "測試組合", amount: 5000 }}
			/>,
		);

		const buyButton = Array.from(container.querySelectorAll("button")).find((button) =>
			button.textContent?.includes("購買"),
		);
		expect(buyButton).toBeTruthy();

		await act(async () => {
			buyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(fetch).toHaveBeenCalled();
		const checkoutCall = vi
			.mocked(fetch)
			.mock.calls.find(([url]) => String(url) === "/api/checkout");
		expect(checkoutCall).toBeTruthy();

		const init = checkoutCall?.[1] as RequestInit;
		const body = JSON.parse(String(init.body)) as Record<string, unknown>;
		expect(body.productId).toBe("combo-a");
		expect(body).not.toHaveProperty("sku");
	});
});
