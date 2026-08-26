import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		invoice: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
	},
}));
vi.mock("./invoice-settings", () => ({
	getInvoiceProvider: vi.fn(),
	isInvoiceProviderName: vi.fn((value: string) => value === "ecpay" || value === "ezpay"),
	withInvoiceOperationLock: vi.fn(async (callback) => callback(db as never)),
}));

import { db } from "@startkiter/database";
import { getInvoiceProvider, withInvoiceOperationLock } from "./invoice-settings";
import { handleRefundInvoice, handleRefundInvoiceForSubscription } from "./invoice-events";

const invoice = {
	id: "invoice-1",
	orderId: "order-1",
	subscriptionId: null,
	periodNumber: null,
	provider: "ecpay",
	status: "ISSUED",
	invoiceNumber: "AB12345678",
	randomCode: "1234",
	invoiceDate: new Date("2026-08-10T00:00:00.000Z"),
	amount: 8800,
	allowanceTotal: 0,
	failReason: null,
	attentionReason: null,
	rawResponse: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("refund invoice handling", () => {
	const provider = { void: vi.fn().mockResolvedValue({ success: true }) };

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.invoice.findUnique).mockResolvedValue(invoice as never);
		vi.mocked(db.invoice.update).mockResolvedValue({ ...invoice, status: "VOIDED" } as never);
		provider.void.mockResolvedValue({ success: true });
		vi.mocked(getInvoiceProvider).mockResolvedValue(provider as never);
	});

	it("voids an issued invoice when refund stays in the same billing month", async () => {
		await handleRefundInvoice("order-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(withInvoiceOperationLock).toHaveBeenCalledTimes(1);
		expect(getInvoiceProvider).toHaveBeenCalledWith("ecpay");
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "invoice-1" },
			data: { status: "VOIDED", attentionReason: null },
		}));
		expect(provider.void).toHaveBeenCalledWith({
			invoiceNumber: "AB12345678",
			reason: "退款",
			invoiceDate: invoice.invoiceDate,
		});
	});

	it("marks a cross-month refund for manual allowance handling", async () => {
		await handleRefundInvoice("order-1", new Date("2026-09-01T00:00:00.000Z"));

		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			data: { attentionReason: "REFUND_NEEDS_ALLOWANCE" },
		}));
	});

	it("marks a refund for manual handling when the provider throws", async () => {
		const providerError = new Error("provider timeout");
		vi.mocked(getInvoiceProvider).mockResolvedValue({
			void: vi.fn().mockRejectedValue(providerError),
		} as never);

		await handleRefundInvoice("order-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "invoice-1" },
			data: { attentionReason: "REFUND_NEEDS_ALLOWANCE", failReason: "provider timeout" },
		}));
	});

	it("uses the latest issued subscription-period invoice when a subscription is canceled", async () => {
		vi.mocked(db.invoice.findFirst).mockResolvedValue({ ...invoice, orderId: null, subscriptionId: "subscription-1", periodNumber: 2 } as never);

		await handleRefundInvoiceForSubscription("subscription-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(withInvoiceOperationLock).toHaveBeenCalledTimes(1);
		expect(db.invoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({
			where: { subscriptionId: "subscription-1", status: "ISSUED" },
			orderBy: { periodNumber: "desc" },
		}));
	});
});
