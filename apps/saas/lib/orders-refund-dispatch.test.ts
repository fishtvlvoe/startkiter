import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		order: { findUnique: vi.fn(), updateMany: vi.fn() },
		invoice: { findUnique: vi.fn(), create: vi.fn() },
	},
}));
vi.mock("@startkiter/api/modules/course/lib/order-refunds", () => ({
	refundOrderThroughGateway: vi.fn(),
	withOrderStateLock: vi.fn(async (_orderId, callback) => callback(db as never)),
}));
vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	handleRefundInvoice: vi.fn(),
}));
vi.mock("@startkiter/payments", async (importOriginal) => ({
	...(await importOriginal<typeof import("@startkiter/payments")>()),
	createMvpCheckoutGateway: vi.fn(),
}));

import { db } from "@startkiter/database";
import { refundOrderThroughGateway } from "@startkiter/api/modules/course/lib/order-refunds";
import { handleRefundInvoice } from "@startkiter/api/modules/course/lib/invoice-events";
import { markOrderPaid, markOrderRefundedInDb } from "./orders";

describe("database refund gateway dispatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.order.findUnique).mockResolvedValue({
			id: "order-id",
			status: "paid",
			amount: 8800,
		} as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue(null);
		vi.mocked(db.invoice.create).mockResolvedValue({ id: "invoice-1" } as never);
		vi.mocked(handleRefundInvoice).mockResolvedValue(null);
		vi.mocked(refundOrderThroughGateway).mockResolvedValue(1);
		vi.mocked(db.order.updateMany).mockResolvedValue({ count: 1 } as never);
	});

	it("marks payment paid under the same order-state lock used by refunds", async () => {
		await expect(markOrderPaid("order-id", "ORDER-1", "PAYMENT-1", "payuni")).resolves.toBe(1);

		expect(db.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "order-id", orderNo: "ORDER-1", status: "pending", paymentGateway: "payuni" },
		}));
	});

	it("does not couple payment success to invoice intent persistence", async () => {
		await expect(markOrderPaid("order-id", "ORDER-1", "PAYMENT-1", "payuni")).resolves.toBe(1);

		expect(db.invoice.create).not.toHaveBeenCalled();
	});

	it("uses the shared gateway dispatcher before handling invoice reconciliation", async () => {
		const result = await markOrderRefundedInDb("ORDER-1");

		expect(result).toBe(1);
		expect(refundOrderThroughGateway).toHaveBeenCalledWith("order-id");
	});

	it("does not mark the order when the gateway refund fails", async () => {
		vi.mocked(refundOrderThroughGateway).mockResolvedValue(0);

		await expect(markOrderRefundedInDb("ORDER-1")).resolves.toBe(0);
		expect(refundOrderThroughGateway).toHaveBeenCalledWith("order-id");
	});

	it("cancels a pending order locally without requiring a gateway transaction", async () => {
		vi.mocked(db.order.findUnique).mockResolvedValue({
			id: "pending-order-id",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			amount: 8800,
			currency: "TWD",
		} as never);
		vi.mocked(refundOrderThroughGateway).mockResolvedValue(1);

		await expect(markOrderRefundedInDb("ORDER-PENDING-1")).resolves.toBe(1);

		expect(refundOrderThroughGateway).toHaveBeenCalledWith("pending-order-id");
	});
});
