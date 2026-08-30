import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { decryptSettingsJson, encryptSettingsJson } from "./settings-crypto";

const SOURCE = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "settings-crypto.ts"),
	"utf8",
);

describe("settings-crypto", () => {
	const secret = "test-settings-encryption-key-32ch";
	const plain = '{"geminiApiKey":"sk-live-should-not-leak"}';

	it("produces ciphertext that is not the plaintext", () => {
		const packed = encryptSettingsJson(plain, secret);

		expect(packed).not.toBe(plain);
		expect(packed).not.toContain("sk-live-should-not-leak");
		expect(packed.startsWith("v1:")).toBe(true);
	});

	it("cannot decrypt plaintext without a key", () => {
		const packed = encryptSettingsJson(plain, secret);

		expect(decryptSettingsJson(packed, "")).toBeNull();
		expect(decryptSettingsJson(packed, "   ")).toBeNull();
		expect(() => encryptSettingsJson(plain, "")).toThrow(/SETTINGS_ENCRYPTION_KEY/);
	});

	it("fails closed on a wrong key instead of returning garbled success", () => {
		const packed = encryptSettingsJson(plain, secret);
		const decrypted = decryptSettingsJson(packed, "a-different-settings-key");

		expect(decrypted).toBeNull();
		expect(decrypted).not.toBe(plain);
	});

	it("round-trips with the correct key", () => {
		const packed = encryptSettingsJson(plain, secret);
		expect(decryptSettingsJson(packed, secret)).toBe(plain);
	});
});

describe("settings-crypto algorithm review", () => {
	it("uses AES-256-GCM rather than a homemade cipher", () => {
		expect(SOURCE).toContain('createCipheriv("aes-256-gcm"');
		expect(SOURCE).toContain('createDecipheriv("aes-256-gcm"');
		expect(SOURCE).not.toMatch(/xor|createCipheriv\("aes-256-ecb"|createCipheriv\("des/i);
	});
});
