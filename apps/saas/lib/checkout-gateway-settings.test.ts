import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: { siteSetting: { findUnique: vi.fn(), upsert: vi.fn() } },
}));
vi.mock("@startkiter/payments", () => ({
	loadCheckoutGatewayCredentials: vi.fn(),
}));

import { db } from "@startkiter/database";
import { loadCheckoutGatewayCredentials } from "@startkiter/payments";
import { getCheckoutGatewaySettings, writeCheckoutGatewaySettings } from "./checkout-gateway-settings";

describe("checkout gateway settings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.SETTINGS_ENCRYPTION_KEY = "settings-test-secret";
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);
		vi.mocked(db.siteSetting.upsert).mockResolvedValue({} as never);
	});

	it("shows SHOPLINE_TEST_MODE=false instead of defaulting the admin form to sandbox", async () => {
		process.env.SHOPLINE_TEST_MODE = "false";
		vi.mocked(loadCheckoutGatewayCredentials)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ gateway: "shopline", credentials: {
				merchantId: "merchant",
				apiKey: "api-key",
				clientKey: undefined,
				signKey: "sign-key",
				testMode: false,
			} })
			.mockResolvedValueOnce(null);

		await expect(getCheckoutGatewaySettings()).resolves.toMatchObject({ testMode: false, shoplineConfigured: true });
	});

	it("accepts Shopline credentials supplied only through environment fallback", async () => {
		process.env.SHOPLINE_MERCHANT_ID = "merchant";
		process.env.SHOPLINE_API_KEY = "api-key";
		process.env.SHOPLINE_SIGN_KEY = "sign-key";

		await expect(writeCheckoutGatewaySettings({
			actorUserId: "admin-1",
			patch: { gateway: "shopline" },
		})).resolves.toEqual({ ok: true });
	});

	it("accepts Stripe credentials supplied only through environment fallback", async () => {
		process.env.STRIPE_SECRET_KEY = "stripe-secret";
		process.env.STRIPE_WEBHOOK_SECRET = "stripe-webhook";

		await expect(writeCheckoutGatewaySettings({
			actorUserId: "admin-1",
			patch: { gateway: "stripe" },
		})).resolves.toEqual({ ok: true });
	});
});
