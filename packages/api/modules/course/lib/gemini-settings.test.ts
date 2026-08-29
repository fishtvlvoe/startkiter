import { db } from "@startkiter/database";
import { decryptSettingsJson } from "../../../../../apps/saas/lib/settings-crypto";
import { readGeminiApiKey, writeGeminiApiKey } from "./gemini-settings";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		siteSetting: {
			findUnique: vi.fn(),
			upsert: vi.fn(),
		},
	},
}));

describe("Gemini API key settings", () => {
	const encryptionSecret = "gemini-settings-test-secret";
	const apiKey = "AIza-test-gemini-key";
	let storedCiphertext = "";

	beforeEach(() => {
		process.env.SETTINGS_ENCRYPTION_KEY = encryptionSecret;
		storedCiphertext = "";
		vi.mocked(db.siteSetting.upsert).mockImplementation((async ({ create }: { create: { ciphertext: string } }) => {
			storedCiphertext = create.ciphertext;
			return create as never;
		}) as never);
		vi.mocked(db.siteSetting.findUnique).mockImplementation((async () =>
			(storedCiphertext ? { id: "gemini-notes", ciphertext: storedCiphertext } : null)
		) as never);
	});

	afterEach(() => {
		delete process.env.SETTINGS_ENCRYPTION_KEY;
		vi.clearAllMocks();
	});

	it("stores the API key encrypted and reads back the original key", async () => {
		await expect(writeGeminiApiKey(apiKey)).resolves.toEqual({ ok: true });

		expect(storedCiphertext).not.toContain(apiKey);
		expect(decryptSettingsJson(storedCiphertext, encryptionSecret)).not.toBeNull();
		await expect(readGeminiApiKey()).resolves.toBe(apiKey);
	});
});
