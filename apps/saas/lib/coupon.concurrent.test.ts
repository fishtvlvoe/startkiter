import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 並行兌換：maxRedemptions=1 時兩個併發 createPendingOrder 最多成功 1 個。
 * 用可序列化的 in-memory db mock 模擬 FOR UPDATE 悲觀鎖。
 */

const couponState = {
	id: "coupon_once",
	code: "TEST_COUPON_ONCE",
	discountType: "amount",
	amountOff: 100,
	percentOff: null as number | null,
	maxDiscountAmount: null as number | null,
	maxRedemptions: 1,
	timesRedeemed: 0,
	active: true,
	startsAt: null as Date | null,
	expiresAt: null as Date | null,
};

let transactionTail: Promise<unknown> = Promise.resolve();

function createTx() {
	return {
		$executeRaw: vi.fn(async () => 1),
		coupon: {
			findUnique: vi.fn(async ({ where }: { where: { code?: string; id?: string } }) => {
				if (where.code === couponState.code || where.id === couponState.id) {
					return { ...couponState };
				}
				return null;
			}),
			update: vi.fn(async ({ data }: { data: { timesRedeemed?: { increment: number } } }) => {
				if (data.timesRedeemed?.increment) {
					couponState.timesRedeemed += data.timesRedeemed.increment;
				}
				return { ...couponState };
			}),
		},
		order: {
			create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
				const now = new Date();
				return {
					id: `order_${Math.random().toString(36).slice(2, 8)}`,
					gatewayTradeNo: null,
					courseAccess: false,
					kitClaimEligible: false,
					paidAt: null,
					refundedAt: null,
					createdAt: now,
					updatedAt: now,
					currency: "TWD",
					status: "pending",
					...data,
				};
			}),
		},
	};
}

vi.mock("@startkiter/database", () => ({
	db: {
		$transaction: vi.fn(async (callback: (tx: ReturnType<typeof createTx>) => Promise<unknown>) => {
			const run = transactionTail.then(() => callback(createTx()));
			transactionTail = run.then(
				() => undefined,
				() => undefined,
			);
			return run;
		}),
		coupon: {
			findUnique: vi.fn(async ({ where }: { where: { code?: string } }) => {
				if (where.code === couponState.code) return { ...couponState };
				return null;
			}),
		},
		order: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
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

vi.mock("./payuni-credentials", () => ({
	loadPayUniCredentials: vi.fn(),
}));

vi.mock("./checkout-gateway-settings", () => ({
	loadGatewayCredentials: vi.fn(),
}));

import { CouponCheckoutError, createPendingOrderForUser } from "./orders";

describe("coupon concurrent checkout redemption (maxRedemptions=1)", () => {
	beforeEach(() => {
		couponState.timesRedeemed = 0;
		transactionTail = Promise.resolve();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("rejects at least one of two concurrent checkouts for TEST_COUPON_ONCE", async () => {
		const results = await Promise.allSettled([
			createPendingOrderForUser("user_a", 8800, "startkiter-mvp", undefined, "payuni", "TEST_COUPON_ONCE"),
			createPendingOrderForUser("user_b", 8800, "startkiter-mvp", undefined, "payuni", "TEST_COUPON_ONCE"),
		]);

		const fulfilled = results.filter((result) => result.status === "fulfilled");
		const rejected = results.filter((result) => result.status === "rejected");

		expect(fulfilled.length).toBeLessThanOrEqual(1);
		expect(rejected.length).toBeGreaterThanOrEqual(1);
		expect(couponState.timesRedeemed).toBeLessThanOrEqual(couponState.maxRedemptions);

		for (const result of rejected) {
			expect(result.status).toBe("rejected");
			if (result.status === "rejected") {
				expect(result.reason).toBeInstanceOf(CouponCheckoutError);
			}
		}

		for (const result of fulfilled) {
			if (result.status === "fulfilled") {
				expect(result.value.couponId).toBe(couponState.id);
				expect(result.value.couponCode).toBe(couponState.code);
				expect(result.value.amount).toBe(8700);
			}
		}
	});
});
