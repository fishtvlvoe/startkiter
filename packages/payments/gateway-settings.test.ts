import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: { siteSetting: { findUnique: vi.fn() } },
}));

import { loadCheckoutGatewayCredentials } from "./gateway-settings";

describe("checkout gateway settings", () => {
	beforeEach(() => {
		delete process.env.SETTINGS_ENCRYPTION_KEY;
		delete process.env.PAYUNI_API_URL;
		delete process.env.PAYUNI_MERCHANT_ID;
		delete process.env.PAYUNI_HASH_KEY;
		delete process.env.PAYUNI_HASH_IV;
	});

	it("keeps the PAYUNi sandbox endpoint when only merchant credentials are configured", async () => {
		process.env.PAYUNI_MERCHANT_ID = "MERCHANT";
		process.env.PAYUNI_HASH_KEY = "12345678901234567890123456789012";
		process.env.PAYUNI_HASH_IV = "1234567890123456";

		await expect(loadCheckoutGatewayCredentials("payuni")).resolves.toEqual({
			gateway: "payuni",
			credentials: {
				merchantId: "MERCHANT",
				hashKey: "12345678901234567890123456789012",
				hashIV: "1234567890123456",
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
		});
	});

	it("fails closed when PAYUNi credentials have invalid lengths", async () => {
		process.env.PAYUNI_MERCHANT_ID = "MERCHANT";
		process.env.PAYUNI_HASH_KEY = "short";
		process.env.PAYUNI_HASH_IV = "1234567890123456";

		await expect(loadCheckoutGatewayCredentials("payuni")).resolves.toBeNull();
	});
});
