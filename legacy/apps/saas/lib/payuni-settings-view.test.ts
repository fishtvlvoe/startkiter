import { describe, expect, it } from "vitest";

import { presentPayuniSettings } from "./payuni-settings-view";

const HASH_KEY = "12345678901234567890123456789012";
const HASH_IV = "1234567890123456";

describe("presentPayuniSettings", () => {
	it("masks settings secrets and prefers settings over env", () => {
		const json = presentPayuniSettings({
			settings: {
				merchantId: "FROM_SETTINGS",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://settings.example/api/upp",
			},
			env: {
				PAYUNI_MERCHANT_ID: "FROM_ENV",
				PAYUNI_HASH_KEY: HASH_KEY,
				PAYUNI_HASH_IV: HASH_IV,
			},
		});

		expect(json.source).toBe("settings");
		expect(json.merchantId).toBe("FROM_SETTINGS");
		expect(json.hashKeyMasked).not.toBe(HASH_KEY);
		expect(json.hashKeyMasked.includes("*")).toBe(true);
		expect(json).not.toHaveProperty("hashKey");
		expect(json).not.toHaveProperty("hashIV");
		expect(JSON.stringify(json)).not.toContain(HASH_KEY);
		expect(JSON.stringify(json)).not.toContain(HASH_IV);
	});

	it("reports env when settings are empty and env is complete", () => {
		const json = presentPayuniSettings({
			settings: null,
			env: {
				PAYUNI_MERCHANT_ID: "FROM_ENV",
				PAYUNI_HASH_KEY: HASH_KEY,
				PAYUNI_HASH_IV: HASH_IV,
			},
		});

		expect(json.source).toBe("env");
		expect(json.merchantId).toBe("FROM_ENV");
		expect(JSON.stringify(json)).not.toContain(HASH_KEY);
	});

	it("reports none when both sources lack complete credentials", () => {
		const json = presentPayuniSettings({
			settings: null,
			env: {
				PAYUNI_MERCHANT_ID: "ONLY_MERCHANT",
			},
		});

		expect(json.source).toBe("none");
		expect(json.merchantId).toBe("ONLY_MERCHANT");
	});
});
