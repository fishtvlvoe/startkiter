import { describe, expect, it, vi } from "vitest";

import { issueInvoiceAllowance, voidInvoice } from "./invoice-operations";

const issuedInvoice = {
	id: "invoice-1",
	status: "ISSUED" as const,
	invoiceNumber: "AB12345678",
	invoiceDate: new Date("2026-08-10T00:00:00.000Z"),
	allowanceTotal: 0,
};

describe("invoice operations", () => {
	it("voids an issued invoice in the same billing month", async () => {
		const provider = { void: vi.fn().mockResolvedValue({ success: true }) };

		const result = await voidInvoice({
			invoice: issuedInvoice,
			provider,
			now: new Date("2026-08-24T00:00:00.000Z"),
		});

		expect(result.status).toBe("VOIDED");
		expect(provider.void).toHaveBeenCalledWith({
			invoiceNumber: "AB12345678",
			reason: "退款",
			invoiceDate: issuedInvoice.invoiceDate,
		});
	});

	it("rejects cross-month voiding without changing the invoice", async () => {
		const provider = { void: vi.fn() };

		await expect(
			voidInvoice({
				invoice: issuedInvoice,
				provider,
				now: new Date("2026-09-01T00:00:00.000Z"),
			}),
		).rejects.toThrow(/折讓|跨月/);
		expect(provider.void).not.toHaveBeenCalled();
	});

	it("accumulates allowance totals for a successful allowance", async () => {
		const provider = { allowance: vi.fn().mockResolvedValue({ success: true, allowanceNumber: "AL-1" }) };

		const result = await issueInvoiceAllowance({
			invoice: { ...issuedInvoice, allowanceTotal: 300 },
			provider,
			amount: 500,
		});

		expect(result).toMatchObject({ status: "ALLOWANCE", allowanceTotal: 800, allowanceNumber: "AL-1" });
	});
});
