import { createEzpayProvider } from "@paid-tw/einvoice-ezpay";
import { describe, expect, it, vi } from "vitest";

import { buildAllowanceInput } from "../../lib/invoice-issue-input";

describe("ezPay allowance adapter payload", () => {
	it("passes the real ezPay payload validator with the normalized merchant order number", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ Status: "SUCCESS", Message: "OK", Result: JSON.stringify({ AllowanceNo: "AL-2" }) }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);
		const provider = createEzpayProvider({
			merchantId: "MERCHANT",
			hashKey: "12345678901234567890123456789012",
			hashIV: "1234567890123456",
			mode: "TEST",
			validatePayload: true,
			fetch: fetchMock,
		});
		const input = buildAllowanceInput({
			provider: "ezpay",
			invoiceNumber: "CD12345678",
			allowanceId: "ALLOW-cmta6nhuc000pmbz7dhj88nx7-1050",
			originalOrderId: "ORDER-1",
			amount: 1050,
			itemName: "開站包",
		});

		await expect(provider.allowance(input)).resolves.toMatchObject({ allowanceNumber: "AL-2" });
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
