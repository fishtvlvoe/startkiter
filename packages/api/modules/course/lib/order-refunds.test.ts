import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		order: { findUnique: vi.fn(), updateMany: vi.fn() },
		$executeRaw: vi.fn(),
		$transaction: vi.fn(),
	},
}));
vi.mock("@startkiter/payments", () => ({
	createMvpCheckoutGateway: vi.fn(),
	loadCheckoutGatewayCredentials: vi.fn(),
}));

import { db } from "@startkiter/database";
import { createMvpCheckoutGateway, loadCheckoutGatewayCredentials } from "@startkiter/payments";
import { markOrderRefundedById, markOrderRefundedByOrderNo, refundOrderThroughGateway } from "./order-refunds";

describe("order refund persistence", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.order.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(db.$executeRaw).mockResolvedValue(0);
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(db as never) as never);
	});

	it("marks a refundable order by id and revokes both access flags", async () => {
		await expect(markOrderRefundedById("order-1")).resolves.toBe(1);

		expect(db.order.updateMany).toHaveBeenCalledWith({
			where: { id: "order-1", status: { in: ["pending", "paid"] } },
			data: {
				status: "refunded",
				courseAccess: false,
				kitClaimEligible: false,
				refundedAt: expect.any(Date),
			},
		});
	});

	it("keeps the legacy order-number refund path available", async () => {
		await expect(markOrderRefundedByOrderNo("SK-1")).resolves.toBe(1);

		expect(db.order.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { orderNo: "SK-1", status: { in: ["pending", "paid"] } } }),
		);
	});

	it.each(["payuni", "shopline", "stripe"] as const)("refunds a paid %s order through its gateway before local revocation", async (paymentGateway) => {
		let inTransaction = false;
		vi.mocked(db.$transaction).mockImplementation(async (callback) => {
			inTransaction = true;
			try {
				return await callback(db as never) as never;
			} finally {
				inTransaction = false;
			}
		});
		vi.mocked(db.order.findUnique).mockResolvedValue({
			orderNo: `SK-${paymentGateway.toUpperCase()}`,
			status: "paid",
			paymentGateway,
			gatewayTradeNo: `${paymentGateway}-trade-1`,
			amount: 8800,
			currency: "TWD",
		} as never);
		vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue({
			gateway: paymentGateway,
			credentials: { merchantId: "m" },
		} as never);
		const processRefund = vi.fn().mockImplementation(async () => {
			expect(inTransaction).toBe(false);
			return { success: true };
		});
		vi.mocked(createMvpCheckoutGateway).mockReturnValue({ processRefund } as never);

		await expect(refundOrderThroughGateway(`order-${paymentGateway}`)).resolves.toBe(1);

		expect(processRefund).toHaveBeenCalledWith({
			gatewayPaymentId: `${paymentGateway}-trade-1`,
			orderNo: `SK-${paymentGateway.toUpperCase()}`,
			amount: 8800,
			currency: "TWD",
		});
		expect(db.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: `order-${paymentGateway}`, status: { in: ["pending", "paid"] } },
			data: expect.objectContaining({ status: "refunded" }),
		}));
		expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 10_000, timeout: 30_000 });
	});

	it("locks a paid order before contacting the external gateway", async () => {
		vi.mocked(db.order.findUnique).mockResolvedValue({
			orderNo: "SK-CONCURRENT",
			status: "paid",
			paymentGateway: "shopline",
			gatewayTradeNo: "shopline-trade-concurrent",
			amount: 8800,
			currency: "TWD",
		} as never);
		vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue({ gateway: "shopline", credentials: { merchantId: "m" } } as never);
		vi.mocked(createMvpCheckoutGateway).mockReturnValue({ processRefund: vi.fn().mockResolvedValue({ success: true }) } as never);

		await refundOrderThroughGateway("order-concurrent");

		expect(db.$executeRaw).toHaveBeenCalledTimes(2);
	});

	it("leaves a paid order untouched when the gateway refund fails", async () => {
		vi.mocked(db.order.findUnique).mockResolvedValue({
			orderNo: "SK-FAILED",
			status: "paid",
			paymentGateway: "shopline",
			gatewayTradeNo: "shopline-trade-failed",
			amount: 8800,
			currency: "TWD",
		} as never);
		vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue({
			gateway: "shopline",
			credentials: { merchantId: "m" },
		} as never);
		const processRefund = vi.fn().mockResolvedValue({ success: false, error: "gateway unavailable" });
		vi.mocked(createMvpCheckoutGateway).mockReturnValue({ processRefund } as never);

		await expect(refundOrderThroughGateway("order-failed")).resolves.toBe(0);

		expect(processRefund).toHaveBeenCalledOnce();
		expect(db.order.updateMany).not.toHaveBeenCalled();
	});

	it("does not hold the order transaction open while the provider is pending", async () => {
		let inTransaction = false;
		vi.mocked(db.$transaction).mockImplementation(async (callback) => {
			inTransaction = true;
			try {
				return await callback(db as never) as never;
			} finally {
				inTransaction = false;
			}
		});
		vi.mocked(db.order.findUnique).mockResolvedValue({
			orderNo: "SK-TIMEOUT",
			status: "paid",
			paymentGateway: "stripe",
			gatewayTradeNo: "pi-timeout",
			amount: 8800,
			currency: "TWD",
		} as never);
		vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue({ gateway: "stripe", credentials: { secretKey: "sk", webhookSecret: "wh" } } as never);
		const processRefund = vi.fn().mockImplementation(async () => {
			expect(inTransaction).toBe(false);
			return { success: true };
		});
		vi.mocked(createMvpCheckoutGateway).mockReturnValue({ processRefund } as never);

		await expect(refundOrderThroughGateway("order-timeout")).resolves.toBe(1);
		expect(processRefund).toHaveBeenCalledOnce();
	});

	it("cancels a pending order locally without requiring a gateway transaction", async () => {
		vi.mocked(db.order.findUnique).mockResolvedValue({
			orderNo: "SK-PENDING-1",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			amount: 8800,
			currency: "TWD",
		} as never);

		await expect(refundOrderThroughGateway("order-pending-1")).resolves.toBe(1);

		expect(loadCheckoutGatewayCredentials).not.toHaveBeenCalled();
		expect(createMvpCheckoutGateway).not.toHaveBeenCalled();
		expect(db.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
		where: { id: "order-pending-1", status: { in: ["pending", "paid"] } },
		data: expect.objectContaining({ status: "refunded" }),
	}));
	});
});
