import { describe, expect, it, vi } from "vitest";

import { resolvePayUniCredentials } from "./credentials";

describe("credentials settings then env", () => {
	it("asks settings before env and uses env when settings empty", () => {
		const readSettings = vi.fn(() => null);
		const resolved = resolvePayUniCredentials({
			readSettings,
			env: {
				PAYUNI_MERCHANT_ID: "M1",
				PAYUNI_HASH_KEY: "12345678901234567890123456789012",
				PAYUNI_HASH_IV: "1234567890123456",
			},
		});

		expect(readSettings).toHaveBeenCalled();
		expect(resolved?.merchantId).toBe("M1");
	});

	it("prefers settings over env", () => {
		const resolved = resolvePayUniCredentials({
			readSettings: () => ({
				merchantId: "FROM_SETTINGS",
				hashKey: "12345678901234567890123456789012",
				hashIV: "1234567890123456",
			}),
			env: {
				PAYUNI_MERCHANT_ID: "FROM_ENV",
				PAYUNI_HASH_KEY: "12345678901234567890123456789012",
				PAYUNI_HASH_IV: "1234567890123456",
			},
		});

		expect(resolved?.merchantId).toBe("FROM_SETTINGS");
	});

	it("returns null when any required key missing", () => {
		const resolved = resolvePayUniCredentials({
			readSettings: () => null,
			env: {
				PAYUNI_MERCHANT_ID: "M1",
			},
		});
		expect(resolved).toBeNull();
	});

	it("returns null when hashKey/hashIV length is invalid", () => {
		const resolved = resolvePayUniCredentials({
			readSettings: () => null,
			env: {
				PAYUNI_MERCHANT_ID: "M1",
				PAYUNI_HASH_KEY: "short",
				PAYUNI_HASH_IV: "1234567890123456",
			},
		});
		expect(resolved).toBeNull();
	});
});
