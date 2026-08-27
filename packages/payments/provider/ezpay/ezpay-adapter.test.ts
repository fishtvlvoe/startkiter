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

describe("ezPay invoice status mapping", () => {
	it.each(["2", 2])("maps the provider's InvoiceStatus=%s to VOIDED", async (invoiceStatus) => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					Status: "SUCCESS",
					Message: "查詢成功",
					Result: JSON.stringify({
						InvoiceNumber: "DQ70632357",
							InvoiceStatus: invoiceStatus,
						CreateTime: "2026-08-27 18:22:54",
						RandomNum: "1234",
						TotalAmt: "390",
					}),
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);
		const provider = createEzpayProvider({
			merchantId: "MERCHANT",
			hashKey: "12345678901234567890123456789012",
			hashIV: "1234567890123456",
			mode: "PRODUCTION",
			validatePayload: true,
			fetch: fetchMock,
		});

		await expect(provider.query({ invoiceNumber: "DQ70632357", providerOptions: { randomNum: "1234" } })).resolves.toMatchObject({
			invoiceNumber: "DQ70632357",
			status: "VOIDED",
		});
	});
});
