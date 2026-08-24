import { beforeEach, describe, expect, it, vi } from "vitest";

const ecpayAdapter = {
	issue: vi.fn().mockResolvedValue({ invoiceNumber: "AB12345678", randomCode: "1234", invoiceDate: new Date("2026-08-24"), raw: { ok: true } }),
	void: vi.fn().mockResolvedValue({ invoiceNumber: "AB12345678", status: "VOIDED", raw: {} }),
	allowance: vi.fn().mockResolvedValue({ allowanceNumber: "AL-1", invoiceNumber: "AB12345678", allowanceDate: new Date("2026-08-24"), totalAmount: 1050, raw: {} }),
};
const ezpayAdapter = {
	issue: vi.fn().mockResolvedValue({ invoiceNumber: "CD12345678", randomCode: "5678", invoiceDate: new Date("2026-08-24"), raw: { ok: true } }),
	void: vi.fn().mockResolvedValue({ invoiceNumber: "CD12345678", status: "VOIDED", raw: {} }),
	allowance: vi.fn().mockResolvedValue({ allowanceNumber: "AL-2", invoiceNumber: "CD12345678", allowanceDate: new Date("2026-08-24"), totalAmount: 1050, raw: {} }),
};

vi.mock("@paid-tw/einvoice-ecpay", () => ({ createEcpayProvider: vi.fn(() => ecpayAdapter) }));
vi.mock("@paid-tw/einvoice-ezpay", () => ({ createEzpayProvider: vi.fn(() => ezpayAdapter) }));

import { createEcpayInvoiceProvider } from "./provider/ecpay/invoice-provider";
import { createEzpayInvoiceProvider } from "./provider/ezpay/invoice-provider";

const config = {
	merchantId: "MERCHANT",
	hashKey: "12345678901234567890123456789012",
	hashIV: "1234567890123456",
	testMode: true,
};

const issueInput = {
	orderId: "ORDER-1",
	buyer: {},
	amount: { salesAmount: 1000, taxAmount: 50, totalAmount: 1050 },
	items: [{ description: "課程", quantity: 1, unitPrice: 1050, amount: 1050 }],
	 taxType: "TAXABLE" as const,
	priceMode: "TAX_INCLUSIVE" as const,
};

describe("InvoiceProvider implementations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		ecpayAdapter.issue.mockResolvedValue({ invoiceNumber: "AB12345678", randomCode: "1234", invoiceDate: new Date("2026-08-24"), raw: { ok: true } });
		ecpayAdapter.void.mockResolvedValue({ invoiceNumber: "AB12345678", status: "VOIDED", raw: {} });
		ecpayAdapter.allowance.mockResolvedValue({ allowanceNumber: "AL-1", invoiceNumber: "AB12345678", allowanceDate: new Date("2026-08-24"), totalAmount: 1050, raw: {} });
		ezpayAdapter.issue.mockResolvedValue({ invoiceNumber: "CD12345678", randomCode: "5678", invoiceDate: new Date("2026-08-24"), raw: { ok: true } });
		ezpayAdapter.void.mockResolvedValue({ invoiceNumber: "CD12345678", status: "VOIDED", raw: {} });
		ezpayAdapter.allowance.mockResolvedValue({ allowanceNumber: "AL-2", invoiceNumber: "CD12345678", allowanceDate: new Date("2026-08-24"), totalAmount: 1050, raw: {} });
	});

	for (const [name, createProvider, adapter, invoiceNumber, allowanceNumber] of [
		["ECPay", createEcpayInvoiceProvider, ecpayAdapter, "AB12345678", "AL-1"],
		["ezPay", createEzpayInvoiceProvider, ezpayAdapter, "CD12345678", "AL-2"],
	] as const) {
		describe(name, () => {
			it("issues an invoice", async () => {
				const result = await createProvider(config).issue(issueInput);
				expect(result).toMatchObject({ invoiceNumber, randomCode: expect.any(String) });
				expect(adapter.issue).toHaveBeenCalledWith(issueInput);
			});

			it("voids an invoice", async () => {
				await expect(createProvider(config).void({ invoiceNumber, reason: "退款" })).resolves.toEqual({ success: true });
				expect(adapter.void).toHaveBeenCalledWith({ invoiceNumber, reason: "退款" });
			});

			it("issues an allowance", async () => {
				await expect(createProvider(config).allowance({ invoiceNumber, amount: 1050 })).resolves.toEqual({ success: true, allowanceNumber });
				expect(adapter.allowance).toHaveBeenCalled();
			});
		});
	}
});
