import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/coupons", () => ({
	redeemCouponInTransaction: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		$transaction: vi.fn(),
	},
}));

vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	handleRefundInvoice: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/send-welcome-email", () => ({
	sendWelcomeEmailsForOrder: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/order-refunds", () => ({
	refundOrderThroughGateway: vi.fn(),
	withOrderStateLock: vi.fn(),
}));

import { db } from "@startkiter/database";

import { createPendingOrderForUser } from "./orders";

describe("createPendingOrderForUser organizationId", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("writes organizationId on the order when provided", async () => {
		const createdRow = {
			id: "order-1",
			userId: "user-1",
			orderNo: "SK20260831abc",
			sku: "startkiter-mvp",
			amount: 8800,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
			paidAt: null,
			refundedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			couponId: null,
			couponCode: null,
		};

		vi.mocked(db.$transaction).mockImplementation(async (callback) =>
			callback({
				order: {
					create: vi.fn().mockResolvedValue(createdRow),
				},
			} as never),
		);

		await createPendingOrderForUser("user-1", 8800, "startkiter-mvp", undefined, "payuni", undefined, "org_a");

		const transactionCallback = vi.mocked(db.$transaction).mock.calls[0]?.[0] as unknown as (
			tx: { order: { create: ReturnType<typeof vi.fn> } },
		) => Promise<unknown>;
		const tx = { order: { create: vi.fn().mockResolvedValue(createdRow) } };
		await transactionCallback(tx);

		expect(tx.order.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: "user-1",
				organizationId: "org_a",
			}),
		});
	});

	it("omits organizationId when not provided", async () => {
		const createdRow = {
			id: "order-1",
			userId: "user-1",
			orderNo: "SK20260831abc",
			sku: "startkiter-mvp",
			amount: 8800,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
			paidAt: null,
			refundedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			couponId: null,
			couponCode: null,
		};

		vi.mocked(db.$transaction).mockImplementation(async (callback) =>
			callback({
				order: {
					create: vi.fn().mockResolvedValue(createdRow),
				},
			} as never),
		);

		await createPendingOrderForUser("user-1");

		const transactionCallback = vi.mocked(db.$transaction).mock.calls[0]?.[0] as unknown as (
			tx: { order: { create: ReturnType<typeof vi.fn> } },
		) => Promise<unknown>;
		const tx = { order: { create: vi.fn().mockResolvedValue(createdRow) } };
		await transactionCallback(tx);

		expect(tx.order.create).toHaveBeenCalledWith({
			data: expect.not.objectContaining({
				organizationId: expect.anything(),
			}),
		});
	});
});
