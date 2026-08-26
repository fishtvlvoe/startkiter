import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: { order: { findUnique: vi.fn(), updateMany: vi.fn() } },
}));
vi.mock("@startkiter/api/modules/course/lib/order-refunds", () => ({
	refundOrderThroughGateway: vi.fn(),
	withOrderStateLock: vi.fn(async (_orderId, callback) => callback(db as never)),
}));
vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	handleRefundInvoice: vi.fn(),
}));
vi.mock("./schedule-after", () => ({
	scheduleAfterResponse: vi.fn(),
}));
vi.mock("@startkiter/payments", async (importOriginal) => ({
	...(await importOriginal<typeof import("@startkiter/payments")>()),
	createMvpCheckoutGateway: vi.fn(),
}));

import { db } from "@startkiter/database";
import { refundOrderThroughGateway } from "@startkiter/api/modules/course/lib/order-refunds";
import { markOrderPaid, markOrderRefundedInDb } from "./orders";

describe("database refund gateway dispatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.order.findUnique).mockResolvedValue({
			id: "order-id",
			status: "paid",
		} as never);
		vi.mocked(refundOrderThroughGateway).mockResolvedValue(1);
		vi.mocked(db.order.updateMany).mockResolvedValue({ count: 1 } as never);
	});

	it("marks payment paid under the same order-state lock used by refunds", async () => {
		await expect(markOrderPaid("order-id", "ORDER-1", "PAYMENT-1", "payuni")).resolves.toBe(1);

		expect(db.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "order-id", orderNo: "ORDER-1", status: "pending", paymentGateway: "payuni" },
		}));
	});

	it("uses the shared gateway dispatcher before scheduling invoice handling", async () => {
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
