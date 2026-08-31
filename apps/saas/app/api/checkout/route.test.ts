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

vi.mock("@startkiter/database", () => ({
	isOrganizationMember: vi.fn(),
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
import { isOrganizationMember } from "@startkiter/database";
import { MVP_AMOUNT_TWD, MVP_SKU, createMvpCheckoutGateway, getProduct } from "@startkiter/payments";

import { buildCheckoutSession, createPendingOrderForUser } from "../../../lib/orders";
import { loadEnabledGatewayCredentials } from "../../../lib/checkout-gateway-settings";
import { POST } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedValidateCoupon = vi.mocked(validateCoupon);
const mockedIsOrganizationMember = vi.mocked(isOrganizationMember);
const mockedLoadCredentials = vi.mocked(loadEnabledGatewayCredentials);
const mockedCreatePendingOrder = vi.mocked(createPendingOrderForUser);
const mockedBuildCheckoutSession = vi.mocked(buildCheckoutSession);
const mockedCreateGateway = vi.mocked(createMvpCheckoutGateway);
const mockedGetProduct = vi.mocked(getProduct);

const SESSION = { user: { id: "user_1", email: "buyer@example.com" }, session: { activeOrganizationId: null } };
const ORG_ID = "org_a";
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
		mockedIsOrganizationMember.mockResolvedValue(false);
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
			undefined,
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

	it("returns 401 when there is no session", async () => {
		mockedGetSession.mockResolvedValue(null as never);

		const response = await POST(jsonRequest({}));

		expect(response.status).toBe(401);
		expect(mockedCreatePendingOrder).not.toHaveBeenCalled();
	});

	it("ignores a client-supplied userId and still charges the signed-in user", async () => {
		mockedCreatePendingOrder.mockResolvedValue(baseOrder(8800));

		const response = await POST(jsonRequest({ userId: "someone_else" }));

		expect(response.status).toBe(200);
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith("user_1", 8800, MVP_SKU, undefined, "payuni", undefined, undefined);
	});
});

describe("POST /api/checkout organization identity", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedLoadCredentials.mockResolvedValue({ gateway: "payuni", credentials: {} } as never);
		mockedBuildCheckoutSession.mockResolvedValue({ type: "form_post", formData: {}, gatewaySessionId: "order_1" } as never);
		mockedGetProduct.mockResolvedValue(MVP_PRODUCT);
		mockedIsOrganizationMember.mockResolvedValue(true);
		mockedCreatePendingOrder.mockResolvedValue(baseOrder(8800));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it.each([
		["owner", "user_owner"],
		["admin", "user_admin"],
		["user", "user_member"],
	] as const)("passes organizationId when %s checks out with active org", async (_role, userId) => {
		mockedGetSession.mockResolvedValue({
			user: { id: userId, email: `${userId}@example.com` },
			session: { activeOrganizationId: ORG_ID },
		} as never);

		const response = await POST(jsonRequest({}));

		expect(response.status).toBe(200);
		expect(mockedIsOrganizationMember).toHaveBeenCalledWith(ORG_ID, userId);
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith(
			userId,
			8800,
			MVP_SKU,
			undefined,
			"payuni",
			undefined,
			ORG_ID,
		);
	});

	it("returns 403 when activeOrganizationId is set but user is not a member", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
			session: { activeOrganizationId: ORG_ID },
		} as never);
		mockedIsOrganizationMember.mockResolvedValue(false);

		const response = await POST(jsonRequest({}));

		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.error).toBe("organization_access_denied");
		expect(mockedCreatePendingOrder).not.toHaveBeenCalled();
	});

	it("creates a personal order without organizationId when no active org is set", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
			session: { activeOrganizationId: null },
		} as never);

		const response = await POST(jsonRequest({}));

		expect(response.status).toBe(200);
		expect(mockedIsOrganizationMember).not.toHaveBeenCalled();
		expect(mockedCreatePendingOrder).toHaveBeenCalledWith(
			"user_1",
			8800,
			MVP_SKU,
			undefined,
			"payuni",
			undefined,
			undefined,
		);
	});
});
