import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		order: { findUnique: vi.fn() },
		courseSubscription: { findUnique: vi.fn() },
		invoice: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
	},
}));
vi.mock("@startkiter/payments", () => ({
	buildIssueInput: vi.fn((input) => input),
}));
vi.mock("./invoice-settings", () => ({
	getInvoiceSettings: vi.fn(),
	getInvoiceProvider: vi.fn(),
}));

import { db } from "@startkiter/database";
import { getInvoiceProvider, getInvoiceSettings } from "./invoice-settings";
import { triggerInvoiceForOrder, triggerInvoiceForSubscriptionPeriod } from "./invoice-events";

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
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getInvoiceSettings).mockResolvedValue(settings);
		vi.mocked(getInvoiceProvider).mockResolvedValue(provider as never);
		vi.mocked(db.order.findUnique).mockResolvedValue(order as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue(null);
		vi.mocked(db.invoice.findFirst).mockResolvedValue(null);
		vi.mocked(db.invoice.create).mockResolvedValue({ id: "invoice-1", status: "FAILED" } as never);
	});

	it("does not create an invoice while the feature is disabled", async () => {
		vi.mocked(getInvoiceSettings).mockResolvedValue({ ...settings, einvoiceEnabled: false });

		await expect(triggerInvoiceForOrder("order-1")).resolves.toBeNull();
		expect(getInvoiceProvider).not.toHaveBeenCalled();
		expect(db.invoice.create).not.toHaveBeenCalled();
	});

	it("creates an issued invoice for a successful one-time order", async () => {
		await triggerInvoiceForOrder("order-1");

		expect(provider.issue).toHaveBeenCalled();
		expect(db.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ order: { connect: { id: "order-1" } }, status: "ISSUED", invoiceNumber: "AB12345678" }),
	}));
	});

	it("records a failed invoice without throwing when the provider rejects", async () => {
		provider.issue.mockResolvedValueOnce({ failReason: "provider unavailable" });

		await expect(triggerInvoiceForOrder("order-1")).resolves.toMatchObject({ status: "FAILED" });
		expect(db.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: "FAILED", failReason: "provider unavailable" }),
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
		} as never);

		await triggerInvoiceForSubscriptionPeriod("subscription-1", 2);

		expect(db.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ subscription: { connect: { id: "subscription-1" } }, periodNumber: 2 }),
		}));
	});
});
