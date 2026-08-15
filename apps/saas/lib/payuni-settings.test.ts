import { describe, expect, it } from "vitest";

import { isClearPayuniPatch, mergePayuniSettings, parsePayuniPatch, validatePayuniPatch } from "./payuni-settings";

describe("mergePayuniSettings", () => {
	it("keeps previous hashKey and hashIV when patch leaves them empty", () => {
		const merged = mergePayuniSettings(
			{
				merchantId: "OLD",
				hashKey: "12345678901234567890123456789012",
				hashIV: "1234567890123456",
				apiUrl: "https://old.example",
			},
			{ merchantId: "NEW", hashKey: "", hashIV: "" },
		);
		expect(merged.merchantId).toBe("NEW");
		expect(merged.hashKey).toBe("12345678901234567890123456789012");
		expect(merged.hashIV).toBe("1234567890123456");
		expect(merged.apiUrl).toBe("https://old.example");
	});
});

describe("validatePayuniPatch", () => {
	it("rejects hashKey not length 32 when provided", () => {
		expect(validatePayuniPatch({ hashKey: "short" })).toBe("invalid_hash_key");
	});

	it("rejects hashIV not length 16 when provided", () => {
		expect(validatePayuniPatch({ hashIV: "nope" })).toBe("invalid_hash_iv");
	});

	it("allows empty secrets meaning keep-existing", () => {
		expect(validatePayuniPatch({ hashKey: "", hashIV: "" })).toBeNull();
	});
});

describe("parsePayuniPatch", () => {
	it("rejects non-object bodies", () => {
		expect(parsePayuniPatch(null).ok).toBe(false);
		expect(parsePayuniPatch("nope").ok).toBe(false);
	});
});

describe("isClearPayuniPatch", () => {
	it("only treats explicit clear true as delete-row", () => {
		expect(isClearPayuniPatch({ clear: true })).toBe(true);
		expect(isClearPayuniPatch({ hashKey: "", hashIV: "" })).toBe(false);
		expect(isClearPayuniPatch({ clear: false })).toBe(false);
	});
});
