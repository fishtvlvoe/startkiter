import { describe, expect, it } from "vitest";

import { loadPayUniCredentials } from "./orders";

const HASH_KEY = "12345678901234567890123456789012";
const HASH_IV = "1234567890123456";
const ENV = {
	PAYUNI_MERCHANT_ID: "FROM_ENV",
	PAYUNI_HASH_KEY: HASH_KEY,
	PAYUNI_HASH_IV: HASH_IV,
	PAYUNI_API_URL: "https://sandbox-api.payuni.com.tw/api/upp",
};

describe("loadPayUniCredentials", () => {
	it("prefers complete admin settings over env", async () => {
		const resolved = await loadPayUniCredentials({
			readSettings: async () => ({
				merchantId: "FROM_SETTINGS",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://settings.example/api/upp",
			}),
			env: ENV,
		});

		expect(resolved?.merchantId).toBe("FROM_SETTINGS");
	});

	it("uses env when settings are empty", async () => {
		const resolved = await loadPayUniCredentials({
			readSettings: async () => null,
			env: ENV,
		});

		expect(resolved?.merchantId).toBe("FROM_ENV");
	});

	it("falls back to env and does not throw when settings cannot be read", async () => {
		const resolved = await loadPayUniCredentials({
			readSettings: async () => {
				throw new Error("corrupt ciphertext");
			},
			env: ENV,
		});

		expect(resolved?.merchantId).toBe("FROM_ENV");
	});
});
