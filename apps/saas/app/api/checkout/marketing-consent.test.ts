import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordEmailConsent } = vi.hoisted(() => ({ recordEmailConsent: vi.fn() }));

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@startkiter/coupons", () => ({ validateCoupon: vi.fn() }));
vi.mock("@startkiter/database", () => ({ isOrganizationMember: vi.fn() }));
vi.mock("@startkiter/newsletter", () => ({ recordEmailConsent }));
vi.mock("../../../lib/orders", () => ({
	createPendingOrderForUser: vi.fn(),
	buildCheckoutSession: vi.fn(),
}));
vi.mock("../../../lib/checkout-gateway-settings", () => ({ loadEnabledGatewayCredentials: vi.fn() }));
vi.mock("../../../lib/public-base-url", () => ({ resolvePublicBaseUrl: vi.fn(() => "https://example.com") }));
vi.mock("@startkiter/payments", () => ({
	MVP_SKU: "mvp",
	getProduct: vi.fn(),
	invoicePreferenceSchema: { safeParse: (value: unknown) => ({ success: true, data: value }) },
}));

import { auth } from "@startkiter/auth";
import { isOrganizationMember } from "@startkiter/database";
import { getProduct } from "@startkiter/payments";
import { loadEnabledGatewayCredentials } from "../../../lib/checkout-gateway-settings";
import { buildCheckoutSession, createPendingOrderForUser } from "../../../lib/orders";
import { POST } from "./route";

describe("POST /api/checkout marketing consent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user-1", email: "learner@example.com" },
			session: { activeOrganizationId: null },
		} as never);
		vi.mocked(isOrganizationMember).mockResolvedValue(false);
		vi.mocked(getProduct).mockResolvedValue({ productId: "mvp", sku: "mvp", amount: 8800, currency: "TWD" } as never);
		vi.mocked(loadEnabledGatewayCredentials).mockResolvedValue({ gateway: "payuni", credentials: {} } as never);
		vi.mocked(createPendingOrderForUser).mockResolvedValue({
			id: "order-1", orderNo: "SK-1", amount: 8800, currency: "TWD", sku: "mvp",
		} as never);
		vi.mocked(buildCheckoutSession).mockResolvedValue({ type: "redirect", checkoutUrl: "https://pay.example" } as never);
	});

	it("records a checkout grant only when the checkbox is checked", async () => {
		const response = await POST(new Request("http://localhost/api/checkout", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ marketingConsent: true }),
		}));

		expect(response.status).toBe(200);
		expect(recordEmailConsent).toHaveBeenCalledWith(expect.objectContaining({
			userId: "user-1",
			consentType: "MARKETING",
			action: "GRANTED",
			source: "checkout",
		}));
	});
});
