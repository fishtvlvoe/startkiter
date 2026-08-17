import { describe, expect, it } from "vitest";

import { decryptSettingsJson, encryptSettingsJson, maskSecret } from "./settings-crypto";

describe("settings crypto", () => {
	it("roundtrips JSON with SETTINGS_ENCRYPTION_KEY", () => {
		const secret = "test-settings-encryption-key-32ch";
		const packed = encryptSettingsJson('{"merchantId":"M1"}', secret);
		expect(packed.startsWith("v1:")).toBe(true);
		expect(decryptSettingsJson(packed, secret)).toBe('{"merchantId":"M1"}');
	});

	it("refuses to encrypt without a key", () => {
		expect(() => encryptSettingsJson("{}", "")).toThrow(/SETTINGS_ENCRYPTION_KEY/);
		expect(() => encryptSettingsJson("{}", "   ")).toThrow(/SETTINGS_ENCRYPTION_KEY/);
	});

	it("returns null for corrupt ciphertext", () => {
		expect(decryptSettingsJson("not-valid", "test-settings-encryption-key-32ch")).toBeNull();
	});
});

describe("maskSecret", () => {
	it("never returns the full value for long secrets", () => {
		const key = "12345678901234567890123456789012";
		const masked = maskSecret(key);
		expect(masked).not.toBe(key);
		expect(masked.includes("*")).toBe(true);
		expect(masked.endsWith("9012")).toBe(true);
	});

	it("uses only asterisks when shorter than four chars", () => {
		expect(maskSecret("ab")).toBe("**");
		expect(maskSecret("")).toBe("");
	});
});
