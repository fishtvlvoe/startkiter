import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Red-light（coupon-security-fixes / task 2.1）：
 * maxRedemptions=1 時，兩個並行 checkout 最多只能成功 1 個。
 * 現行 checkout 只呼叫 validateCoupon、不原子遞增 timesRedeemed，兩個請求都會過。
 */

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/coupons", () => ({
	validateCoupon: vi.fn(),
}));

vi.mock("./orders", () => ({
	createPendingOrderForUser: vi.fn(),
	buildCheckoutSession: vi.fn(),
}));

vi.mock("./checkout-gateway-settings", () => ({
	loadEnabledGatewayCredentials: vi.fn(),
}));

vi.mock("./public-base-url", () => ({
	resolvePublicBaseUrl: vi.fn(() => "https://example.com"),
}));

vi.mock("@startkiter/payments", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/payments")>();
	return {
		...actual,
		getProduct: vi.fn(),
	};
});

import { auth } from "@startkiter/auth";
import { validateCoupon } from "@startkiter/coupons";
import { MVP_AMOUNT_TWD, MVP_SKU, getProduct } from "@startkiter/payments";

import { POST } from "../app/api/checkout/route";
import { buildCheckoutSession, createPendingOrderForUser } from "./orders";
import { loadEnabledGatewayCredentials } from "./checkout-gateway-settings";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedValidateCoupon = vi.mocked(validateCoupon);
const mockedLoadCredentials = vi.mocked(loadEnabledGatewayCredentials);
const mockedCreatePendingOrder = vi.mocked(createPendingOrderForUser);
const mockedBuildCheckoutSession = vi.mocked(buildCheckoutSession);
const mockedGetProduct = vi.mocked(getProduct);

const SESSION = { user: { id: "user_concurrent", email: "buyer@example.com" } };
const MVP_PRODUCT = {
	productId: MVP_SKU,
	sku: MVP_SKU,
	amount: MVP_AMOUNT_TWD,
	currency: "TWD" as const,
};

function jsonRequest(body: unknown) {
	return new Request("http://localhost/api/checkout", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

function baseOrder(amount: number, orderNo: string) {
	return {
		id: `order_${orderNo}`,
		userId: "user_concurrent",
		orderNo,
		sku: MVP_SKU,
		amount,
		currency: "TWD",
		status: "pending" as const,
		paymentGateway: "payuni" as const,
		gatewayTradeNo: null,
		courseAccess: false,
		kitClaimEligible: false,
		paidAt: null,
		refundedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

describe("coupon concurrent checkout redemption (maxRedemptions=1)", () => {
	const couponState = {
		code: "TEST_COUPON_ONCE",
		maxRedemptions: 1,
		timesRedeemed: 0,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		couponState.timesRedeemed = 0;

		mockedGetSession.mockResolvedValue(SESSION as never);
		mockedLoadCredentials.mockResolvedValue({ gateway: "payuni", credentials: {} } as never);
		mockedBuildCheckoutSession.mockResolvedValue({
			type: "form_post",
			formData: {},
			gatewaySessionId: "gw_1",
		} as never);
		mockedGetProduct.mockResolvedValue(MVP_PRODUCT);

		// 模擬現行行為：只檢查、不在同一交易內遞增（競態／重複利用窗口）
		mockedValidateCoupon.mockImplementation(async (code: string) => {
			if (code.trim().toUpperCase() !== couponState.code) {
				return { valid: false as const, reason: "not_found" as const };
			}
			if (couponState.timesRedeemed >= couponState.maxRedemptions) {
				return { valid: false as const, reason: "max_redemptions_reached" as const };
			}
			return { valid: true as const, discountAmount: 100, finalAmount: 8700 };
		});

		let orderSeq = 0;
		mockedCreatePendingOrder.mockImplementation(async () => {
			orderSeq += 1;
			// 現行漏洞：建立訂單後沒有原子遞增 timesRedeemed
			return baseOrder(8700, `SK_CONCURRENT_${orderSeq}`);
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("rejects at least one of two concurrent checkouts for TEST_COUPON_ONCE", async () => {
		const [first, second] = await Promise.all([
			POST(jsonRequest({ couponCode: "TEST_COUPON_ONCE" })),
			POST(jsonRequest({ couponCode: "TEST_COUPON_ONCE" })),
		]);

		const statuses = [first.status, second.status];
		const successCount = statuses.filter((status) => status === 200).length;

		expect(successCount).toBeLessThanOrEqual(1);
		expect(couponState.timesRedeemed).toBeLessThanOrEqual(couponState.maxRedemptions);
	});
});
