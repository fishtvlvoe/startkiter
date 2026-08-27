import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:crypto")>()),
	randomUUID: vi.fn(() => "operation-token"),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		invoice: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
	},
}));
vi.mock("./invoice-settings", () => ({
	getInvoiceSettings: vi.fn(),
	createInvoiceProvider: vi.fn(),
	isInvoiceProviderName: vi.fn((value: string) => value === "ecpay" || value === "ezpay"),
	withInvoiceOperationLock: vi.fn(async (callback) => callback(db as never)),
}));

import { db } from "@startkiter/database";
import { createInvoiceProvider, getInvoiceSettings, withInvoiceOperationLock } from "./invoice-settings";
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
		vi.mocked(getInvoiceSettings).mockResolvedValue({ provider: "ecpay" } as never);
		vi.mocked(db.invoice.findUnique)
			.mockResolvedValueOnce(invoice as never)
			.mockResolvedValue({ ...invoice, attentionReason: "REFUND_IN_PROGRESS", operationToken: "operation-token" } as never);
		vi.mocked(db.invoice.update).mockResolvedValue({ ...invoice, status: "VOIDED" } as never);
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		provider.void.mockResolvedValue({ success: true });
		vi.mocked(createInvoiceProvider).mockReturnValue(provider as never);
	});

	it("voids an issued invoice when refund stays in the same billing month", async () => {
		await handleRefundInvoice("order-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(withInvoiceOperationLock).toHaveBeenCalled();
		expect(createInvoiceProvider).toHaveBeenCalledWith({ provider: "ecpay" });
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: expect.objectContaining({ id: "invoice-1" }),
			data: expect.objectContaining({ status: "VOIDED", attentionReason: null }),
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
		vi.mocked(createInvoiceProvider).mockReturnValue({
			void: vi.fn().mockRejectedValue(providerError),
		} as never);

		await handleRefundInvoice("order-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: expect.objectContaining({ id: "invoice-1" }),
			data: expect.objectContaining({ attentionReason: "REFUND_NEEDS_ALLOWANCE", failReason: "provider timeout" }),
		}));
	});

	it("uses the latest issued subscription-period invoice when a subscription is canceled", async () => {
		vi.mocked(db.invoice.findFirst).mockResolvedValue({ ...invoice, orderId: null, subscriptionId: "subscription-1", periodNumber: 2 } as never);

		await handleRefundInvoiceForSubscription("subscription-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(withInvoiceOperationLock).toHaveBeenCalled();
		expect(db.invoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({
			where: { subscriptionId: "subscription-1", status: "ISSUED" },
			orderBy: { periodNumber: "desc" },
		}));
	});
});
