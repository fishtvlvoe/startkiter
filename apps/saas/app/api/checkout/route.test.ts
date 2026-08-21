import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("../../../lib/orders", () => ({
	loadPayUniCredentials: vi.fn(),
	createPendingOrderForUser: vi.fn(),
	buildPayuniSession: vi.fn(),
}));

vi.mock("../../../lib/public-base-url", () => ({
	resolvePublicBaseUrl: vi.fn(() => "https://example.com"),
}));

import { auth } from "@startkiter/auth";
import { validateCoupon } from "@startkiter/coupons";
import { createMvpCheckoutGateway } from "@startkiter/payments";

import { buildPayuniSession, createPendingOrderForUser, loadPayUniCredentials } from "../../../lib/orders";
import { POST } from "./route";

vi.mock("@startkiter/payments", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/payments")>();
	return {
		...actual,
		createMvpCheckoutGateway: vi.fn(() => ({ createPaymentSession: vi.fn() })),
	};
});

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedValidateCoupon = vi.mocked(validateCoupon);
const mockedLoadCredentials = vi.mocked(loadPayUniCredentials);
const mockedCreatePendingOrder = vi.mocked(createPendingOrderForUser);
const mockedBuildPayuniSession = vi.mocked(buildPayuniSession);
const mockedCreateGateway = vi.mocked(createMvpCheckoutGateway);

const SESSION = { user: { id: "user_1", email: "buyer@example.com" } };

function jsonRequest(body: unknown) {
	return new Request("http://localhost/api/checkout", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

function baseOrder(amount: number) {
	return {
		id: "order_1",
		userId: "user_1",
		orderNo: "SK20260821abc",
		sku: "startkiter-mvp",
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

describe("POST /api/checkout coupon integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedGetSession.mockResolvedValue(SESSION as never);
		mockedLoadCredentials.mockResolvedValue({} as never);
		mockedCreateGateway.mockReturnValue({ createPaymentSession: vi.fn() } as never);
		mockedBuildPayuniSession.mockResolvedValue({ formUrl: "https://payuni.example/pay" } as never);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("charges the discounted amount for a valid couponCode (Scenario: Checkout with valid coupon charges discounted amount)", async () => {
		mockedValidateCoupon.mockResolvedValue({ valid: true, discountAmount: 100, finalAmount: 8700 });
		mockedCreatePendingOrder.mockResolvedValue(baseOrder(8700));

		const response = await POST(jsonRequest({ couponCode: "SAVE100" }));

		expect(response.status).toBe(200);
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith("user_1", 8700);
		const body = await response.json();
		expect(body.amount).toBe(8700);
	});

	it("rejects checkout with an invalid couponCode and does not create an order (Scenario: Checkout with invalid coupon code fails closed)", async () => {
		mockedValidateCoupon.mockResolvedValue({ valid: false, reason: "expired" });

		const response = await POST(jsonRequest({ couponCode: "EXPIRED1" }));

		expect(response.status).toBe(400);
		expect(mockedCreatePendingOrder).not.toHaveBeenCalled();
		const body = await response.json();
		expect(body.error).toBe("invalid_coupon");
		expect(body.reason).toBe("expired");
	});

	it("charges full price when no couponCode is supplied (Scenario: Checkout without a coupon code charges full price)", async () => {
		mockedCreatePendingOrder.mockResolvedValue(baseOrder(8800));

		const response = await POST(jsonRequest({}));

		expect(response.status).toBe(200);
		expect(mockedValidateCoupon).not.toHaveBeenCalled();
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith("user_1", 8800);
	});
});
