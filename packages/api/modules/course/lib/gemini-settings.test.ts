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
		await expect(writeGeminiApiKey("instructor-a", apiKey)).resolves.toEqual({ ok: true });

		expect(storedCiphertext).not.toContain(apiKey);
		expect(decryptSettingsJson(storedCiphertext, encryptionSecret)).not.toBeNull();
		await expect(readGeminiApiKey("instructor-a")).resolves.toBe(apiKey);
	});

	it("keeps each instructor API key isolated", async () => {
		const secondKey = "AIza-second-instructor-key";
		await writeGeminiApiKey("instructor-a", apiKey);
		const firstCiphertext = storedCiphertext;
		await writeGeminiApiKey("instructor-b", secondKey);

		expect(firstCiphertext).not.toBe(storedCiphertext);
		vi.mocked(db.siteSetting.findUnique).mockImplementation((async ({ where }: { where: { id: string } }) => {
			if (where.id === "gemini-notes:instructor-a") return { id: where.id, ciphertext: firstCiphertext };
			return { id: where.id, ciphertext: storedCiphertext };
		}) as never);
		await expect(readGeminiApiKey("instructor-a")).resolves.toBe(apiKey);
		await expect(readGeminiApiKey("instructor-b")).resolves.toBe(secondKey);
	});
});
