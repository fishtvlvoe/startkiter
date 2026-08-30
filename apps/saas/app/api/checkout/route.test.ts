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
	createPendingOrderForUser: vi.fn(),
	buildCheckoutSession: vi.fn(),
}));
vi.mock("../../../lib/checkout-gateway-settings", () => ({
	loadEnabledGatewayCredentials: vi.fn(),
}));

vi.mock("../../../lib/public-base-url", () => ({
	resolvePublicBaseUrl: vi.fn(() => "https://example.com"),
}));

vi.mock("@startkiter/payments", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/payments")>();
	return {
		...actual,
		createMvpCheckoutGateway: vi.fn(() => ({ createPaymentSession: vi.fn() })),
		getProduct: vi.fn(),
	};
});

import { auth } from "@startkiter/auth";
import { validateCoupon } from "@startkiter/coupons";
import { MVP_AMOUNT_TWD, MVP_SKU, createMvpCheckoutGateway, getProduct } from "@startkiter/payments";

import { buildCheckoutSession, createPendingOrderForUser } from "../../../lib/orders";
import { loadEnabledGatewayCredentials } from "../../../lib/checkout-gateway-settings";
import { POST } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedValidateCoupon = vi.mocked(validateCoupon);
const mockedLoadCredentials = vi.mocked(loadEnabledGatewayCredentials);
const mockedCreatePendingOrder = vi.mocked(createPendingOrderForUser);
const mockedBuildCheckoutSession = vi.mocked(buildCheckoutSession);
const mockedCreateGateway = vi.mocked(createMvpCheckoutGateway);
const mockedGetProduct = vi.mocked(getProduct);

const SESSION = { user: { id: "user_1", email: "buyer@example.com" } };
const MVP_PRODUCT = { productId: MVP_SKU, sku: MVP_SKU, amount: MVP_AMOUNT_TWD, currency: "TWD" as const };
const BUNDLE_PRODUCT = { productId: "bundle_1", sku: "bundle_1", amount: 6000, currency: "TWD" as const };

function jsonRequest(body: unknown) {
	return new Request("http://localhost/api/checkout", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

function baseOrder(amount: number, sku = MVP_SKU) {
	return {
		id: "order_1",
		userId: "user_1",
		orderNo: "SK20260821abc",
		sku,
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
		mockedLoadCredentials.mockResolvedValue({ gateway: "payuni", credentials: {} } as never);
		mockedBuildCheckoutSession.mockResolvedValue({ type: "form_post", formData: {}, gatewaySessionId: "order_1" } as never);
		mockedGetProduct.mockResolvedValue(MVP_PRODUCT);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("charges the discounted amount for a valid couponCode (Scenario: Checkout with valid coupon charges discounted amount)", async () => {
		mockedValidateCoupon.mockResolvedValue({ valid: true, discountAmount: 100, finalAmount: 8700 });
		mockedCreatePendingOrder.mockResolvedValue(baseOrder(8700));

		const response = await POST(jsonRequest({ couponCode: "SAVE100" }));

		expect(response.status).toBe(200);
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith(
			"user_1",
			8800,
			MVP_SKU,
			undefined,
			"payuni",
			"SAVE100",
		);
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
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith(
			"user_1",
			8800,
			MVP_SKU,
			undefined,
			"payuni",
			undefined,
		);
	});

	it("charges the bundle's configured price and stores the bundle id as sku when productId is a bundle (Scenario: Checkout amount for a bundle product uses the bundle's configured price / Created order for a bundle stores the bundle's own product id)", async () => {
		mockedGetProduct.mockResolvedValue(BUNDLE_PRODUCT);
		mockedCreatePendingOrder.mockResolvedValue(baseOrder(6000, "bundle_1"));

		const response = await POST(jsonRequest({ productId: "bundle_1" }));

		expect(response.status).toBe(200);
		expect(mockedGetProduct).toHaveBeenCalledWith("bundle_1");
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith(
			"user_1",
			6000,
			"bundle_1",
			undefined,
			"payuni",
			undefined,
		);
		const body = await response.json();
		expect(body.amount).toBe(6000);
		expect(body.sku).toBe("bundle_1");
	});

	it("returns 404 without creating an order when productId does not resolve to a product", async () => {
		mockedGetProduct.mockResolvedValue(null);

		const response = await POST(jsonRequest({ productId: "nonexistent" }));

		expect(response.status).toBe(404);
		expect(mockedCreatePendingOrder).not.toHaveBeenCalled();
	});
});
