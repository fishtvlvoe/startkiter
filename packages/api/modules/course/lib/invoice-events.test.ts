import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:crypto")>()),
	randomUUID: vi.fn(() => "operation-token"),
}));

vi.mock("@startkiter/database", () => ({
		db: {
			order: { findUnique: vi.fn() },
			courseSubscription: { findUnique: vi.fn() },
		invoice: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
		},
}));
vi.mock("@startkiter/payments", () => ({
	buildIssueInput: vi.fn((input) => input),
}));
vi.mock("./invoice-settings", () => ({
	getInvoiceSettings: vi.fn(),
	createInvoiceProvider: vi.fn(),
	withInvoiceOperationLock: vi.fn(async (callback) => callback(db as never)),
	INVOICE_OPERATION_LEASE_MS: 60_000,
}));
vi.mock("./order-refunds", () => ({
	acquireOrderStateLock: vi.fn(),
}));

import { db } from "@startkiter/database";
import { createInvoiceProvider, getInvoiceSettings, withInvoiceOperationLock } from "./invoice-settings";
import { retryPendingInvoices, triggerInvoiceForOrder, triggerInvoiceForSubscriptionPeriod } from "./invoice-events";

const settings = {
	provider: "ecpay" as const,
	merchantId: "MERCHANT",
	hashKey: "1234567890123456",
	hashIV: "1234567890123456",
	testMode: true,
	sellerName: "賣家",
	sellerTaxId: "12345678",
	autoIssueEnabled: true,
	einvoiceEnabled: true,
};

const order = {
	id: "order-1",
	orderNo: "ORDER-1",
	amount: 8800,
	sku: "startkiter-mvp",
	status: "paid",
	invoiceType: "COMPANY",
	invoiceCarrierType: null,
	invoiceCarrierId: null,
	invoiceTaxId: "12345678",
	invoiceTitle: "公司",
	invoiceAddress: "台北市",
	invoiceLoveCode: null,
	user: { name: "買家", email: "buyer@example.com" },
};

describe("invoice event triggers", () => {
	const provider = {
		issue: vi.fn().mockResolvedValue({ invoiceNumber: "AB12345678", randomCode: "1234", invoiceDate: new Date("2026-08-24"), raw: {} }),
		query: vi.fn().mockResolvedValue({ status: "ISSUED", invoiceNumber: "AB12345678", randomCode: "1234", invoiceDate: new Date("2026-08-24"), raw: {} }),
		void: vi.fn().mockResolvedValue({ success: true }),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-24T12:00:00.000Z"));
		vi.mocked(getInvoiceSettings).mockResolvedValue(settings);
		vi.mocked(createInvoiceProvider).mockReturnValue(provider as never);
		vi.mocked(db.order.findUnique).mockResolvedValue(order as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue(null);
		vi.mocked(db.invoice.findFirst).mockResolvedValue(null);
		vi.mocked(db.invoice.create).mockResolvedValue({
			id: "invoice-1",
			status: "PENDING",
			operationToken: "operation-token",
			updatedAt: new Date(),
		} as never);
		vi.mocked(db.invoice.update).mockResolvedValue({ id: "invoice-1", status: "ISSUED" } as never);
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		provider.void.mockResolvedValue({ success: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not create an invoice while the feature is disabled", async () => {
		vi.mocked(getInvoiceSettings).mockResolvedValue({ ...settings, einvoiceEnabled: false });

		await expect(triggerInvoiceForOrder("order-1")).resolves.toBeNull();
		expect(createInvoiceProvider).not.toHaveBeenCalled();
		expect(db.invoice.create).not.toHaveBeenCalled();
	});

	it("creates an issued invoice for a successful one-time order", async () => {
		vi.mocked(db.invoice.findUnique)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: "invoice-1", status: "PENDING", operationToken: "operation-token", updatedAt: new Date() } as never);
		await triggerInvoiceForOrder("order-1");

		expect(withInvoiceOperationLock).toHaveBeenCalled();
		expect(provider.issue).toHaveBeenCalled();
		expect(db.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ order: { connect: { id: "order-1" } }, status: "PENDING" }),
	}));
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ status: "ISSUED", invoiceNumber: "AB12345678" }),
	}));
	});

	it("issues a fresh pending intent immediately", async () => {
		vi.mocked(db.invoice.findUnique)
			.mockResolvedValueOnce({
				id: "invoice-1",
				status: "PENDING",
				attentionReason: null,
				operationToken: null,
				updatedAt: new Date(),
			} as never)
			.mockResolvedValueOnce({
				id: "invoice-1",
				status: "PENDING",
				operationToken: "operation-token",
				updatedAt: new Date(),
			} as never);

		await triggerInvoiceForOrder("order-1");

		expect(provider.issue).toHaveBeenCalledOnce();
	});

	it("does not replace an active invoice issue lease", async () => {
		vi.mocked(db.invoice.findUnique).mockResolvedValue({
			id: "invoice-1",
			status: "PENDING",
			attentionReason: "ISSUE_IN_PROGRESS",
			operationToken: "active-operation",
			operationStartedAt: new Date(),
			updatedAt: new Date(),
		} as never);

		await triggerInvoiceForOrder("order-1");

		expect(provider.issue).not.toHaveBeenCalled();
		 expect(db.invoice.update).not.toHaveBeenCalled();
	});

	it("records a failed invoice without throwing when the provider rejects", async () => {
		vi.mocked(db.invoice.findUnique)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: "invoice-1", status: "PENDING", operationToken: "operation-token", updatedAt: new Date() } as never);
		provider.issue.mockResolvedValueOnce({ failReason: "provider unavailable" });
		vi.mocked(db.invoice.update).mockResolvedValueOnce({ id: "invoice-1", status: "FAILED" } as never);

		await expect(triggerInvoiceForOrder("order-1")).resolves.toMatchObject({ status: "FAILED" });
		expect(db.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ status: "PENDING" }),
		}));
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ status: "FAILED", failReason: "provider unavailable" }),
	}));
	});

	it("retries a previously failed invoice when a paid webhook is replayed", async () => {
		vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
			id: "invoice-1",
			status: "FAILED",
			operationToken: null,
			updatedAt: new Date(),
		} as never).mockResolvedValueOnce({ id: "invoice-1", status: "PENDING", operationToken: "operation-token", updatedAt: new Date() } as never);

		await expect(triggerInvoiceForOrder("order-1")).resolves.toMatchObject({ status: "ISSUED" });
		expect(provider.issue).toHaveBeenCalledTimes(1);
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "invoice-1" },
			data: expect.objectContaining({ status: "ISSUED", invoiceNumber: "AB12345678", failReason: null }),
		}));
	});

	it("does not issue an invoice after the order has been refunded", async () => {
		vi.mocked(db.order.findUnique).mockResolvedValueOnce({ ...order, status: "refunded" } as never);

		await expect(triggerInvoiceForOrder("order-1")).resolves.toBeNull();
		expect(provider.issue).not.toHaveBeenCalled();
		expect(db.invoice.create).not.toHaveBeenCalled();
	});

	it("keeps an ambiguous issue marked for provider reconciliation", async () => {
		vi.mocked(db.invoice.findUnique)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: "invoice-1", status: "PENDING", operationToken: "operation-token", updatedAt: new Date() } as never);
		provider.issue.mockResolvedValueOnce({ failReason: "timeout", ambiguous: true });
		vi.mocked(db.invoice.update).mockResolvedValueOnce({ id: "invoice-1", status: "FAILED" } as never);

		await expect(triggerInvoiceForOrder("order-1")).resolves.toMatchObject({ status: "FAILED" });
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				status: "FAILED",
				attentionReason: "ISSUE_NEEDS_REVIEW",
				operationToken: "operation-token",
			}),
		}));
	});

	it("voids an invoice when the order is refunded during provider issuance", async () => {
		const pendingInvoice = {
			id: "invoice-1",
			status: "PENDING",
			operationToken: "operation-token",
			updatedAt: new Date(),
			invoiceNumber: null,
			invoiceDate: null,
		};
		const issuedInvoice = {
			id: "invoice-1",
			status: "ISSUED",
			invoiceNumber: "AB12345678",
			invoiceDate: new Date("2026-08-24"),
			amount: 8800,
		};
		vi.mocked(db.invoice.findUnique)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(pendingInvoice as never)
			.mockResolvedValue({ ...issuedInvoice, status: "VOIDED" } as never);
		vi.mocked(db.invoice.create).mockResolvedValue(pendingInvoice as never);
		vi.mocked(db.invoice.update).mockResolvedValue(issuedInvoice as never);
		vi.mocked(db.order.findUnique)
			.mockResolvedValueOnce(order as never)
			.mockResolvedValue({ status: "refunded" } as never);

		await expect(triggerInvoiceForOrder("order-1")).resolves.toMatchObject({ status: "VOIDED" });
		expect(provider.issue).toHaveBeenCalledOnce();
		expect(provider.void).toHaveBeenCalledWith({
			invoiceNumber: "AB12345678",
			reason: "退款",
			invoiceDate: issuedInvoice.invoiceDate,
		});
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "invoice-1", status: "ISSUED", attentionReason: "VOID_AFTER_REFUND" },
			data: { status: "VOIDED", attentionReason: null, failReason: null },
		}));
	});

	it("retries stale order and subscription invoice intents", async () => {
		vi.mocked(db.invoice.findMany).mockResolvedValue([
			{ orderId: "order-1", subscriptionId: null, periodNumber: null },
			{ orderId: null, subscriptionId: "subscription-1", periodNumber: 2 },
		] as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue({ id: "invoice-1", status: "PENDING", operationToken: "operation-token", updatedAt: new Date(Date.now() - 120_000) } as never);
		vi.mocked(db.invoice.update).mockResolvedValue({ id: "invoice-1", status: "ISSUED" } as never);
		vi.mocked(db.courseSubscription.findUnique).mockResolvedValue({
			id: "subscription-1",
			gatewayTradeNo: "SUBTRADE",
			pricePerPeriod: 390,
			invoiceType: "PERSONAL",
			invoiceCarrierType: null,
			invoiceCarrierId: null,
			invoiceTaxId: null,
			invoiceTitle: null,
			invoiceAddress: null,
			invoiceLoveCode: null,
			user: { name: "買家", email: "buyer@example.com" },
			plan: { course: { title: "課程" } },
			status: "ACTIVE",
			canceledAt: null,
		} as never);

		await expect(retryPendingInvoices()).resolves.toEqual({ scanned: 2, issued: 2, failed: 0 });
		expect(provider.issue).toHaveBeenCalledTimes(1);
		expect(provider.query).toHaveBeenCalledOnce();
		expect(db.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({
			where: { OR: expect.arrayContaining([
				expect.objectContaining({ status: { in: ["PENDING", "FAILED"] }, updatedAt: { lte: expect.any(Date) } }),
			]) },
			orderBy: { updatedAt: "asc" },
			take: 50,
		}));
	});

	it("creates a unique subscription-period invoice using the supplied period number", async () => {
		vi.mocked(db.courseSubscription.findUnique).mockResolvedValue({
			id: "subscription-1",
			gatewayTradeNo: "SUBTRADE",
			pricePerPeriod: 390,
			invoiceType: "PERSONAL",
			invoiceCarrierType: "member",
			invoiceCarrierId: null,
			invoiceTaxId: null,
			invoiceTitle: null,
			invoiceAddress: null,
			invoiceLoveCode: null,
			user: { name: "買家", email: "buyer@example.com" },
			plan: { course: { title: "課程" } },
			status: "ACTIVE",
			canceledAt: null,
		} as never);

		await triggerInvoiceForSubscriptionPeriod("subscription-1", 2);

		expect(withInvoiceOperationLock).toHaveBeenCalled();
		expect(db.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ subscription: { connect: { id: "subscription-1" } }, periodNumber: 2, status: "PENDING" }),
		}));
	});

	it("recovers a failed subscription-period invoice by querying before retry", async () => {
		vi.mocked(db.invoice.findUnique).mockResolvedValue({ id: "invoice-1", status: "PENDING", operationToken: "operation-token", updatedAt: new Date() } as never);
		vi.mocked(db.invoice.findFirst).mockResolvedValue({
			id: "invoice-1",
			status: "FAILED",
			operationToken: "operation-token",
			updatedAt: new Date(),
		} as never);
		vi.mocked(db.courseSubscription.findUnique).mockResolvedValue({
			id: "subscription-1",
			gatewayTradeNo: "SUBTRADE",
			pricePerPeriod: 390,
			invoiceType: "PERSONAL",
			invoiceCarrierType: "member",
			invoiceCarrierId: null,
			invoiceTaxId: null,
			invoiceTitle: null,
			invoiceAddress: null,
			invoiceLoveCode: null,
			user: { name: "買家", email: "buyer@example.com" },
			plan: { course: { title: "課程" } },
			status: "ACTIVE",
			canceledAt: null,
		} as never);

		await expect(triggerInvoiceForSubscriptionPeriod("subscription-1", 2)).resolves.toMatchObject({ status: "ISSUED" });
		expect(provider.issue).not.toHaveBeenCalled();
		expect(provider.query).toHaveBeenCalledOnce();
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "invoice-1" },
			data: expect.objectContaining({ status: "ISSUED", invoiceNumber: "AB12345678" }),
		}));
	});
});
