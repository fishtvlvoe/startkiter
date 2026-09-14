import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: { siteSetting: { findUnique: vi.fn(), upsert: vi.fn() } },
}));

import { db } from "@startkiter/database";

import { encryptSettingsJson } from "../../course/lib/settings-crypto";
import {
	AI_PROVIDER_SETTING_ID,
	loadAiProviderResolution,
	readAiProviderSettings,
	writeAiProviderSettings,
} from "./provider-settings";

describe("ai provider settings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.SETTINGS_ENCRYPTION_KEY = "ai-provider-test-secret";
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);
		vi.mocked(db.siteSetting.upsert).mockResolvedValue({} as never);
	});

	it("returns OpenAI gpt-4o-mini defaults when no setting row exists", async () => {
		await expect(readAiProviderSettings()).resolves.toEqual({
			provider: "openai",
			model: "gpt-4o-mini",
			hasGeminiKey: false,
		});
	});

	it("round-trips an OpenAI provider/model selection", async () => {
		let storedCiphertext: string | null = null;
		vi.mocked(db.siteSetting.upsert).mockImplementation(async ({ create, update }) => {
			storedCiphertext = (update as { ciphertext: string }).ciphertext ?? create.ciphertext;
			return {} as never;
		});
		vi.mocked(db.siteSetting.findUnique).mockImplementation(async () =>
			storedCiphertext
				? ({ id: AI_PROVIDER_SETTING_ID, ciphertext: storedCiphertext } as never)
				: null,
		);

		await expect(
			writeAiProviderSettings({ provider: "openai", model: "gpt-4o" }),
		).resolves.toEqual({ ok: true });

		await expect(readAiProviderSettings()).resolves.toEqual({
			provider: "openai",
			model: "gpt-4o",
			hasGeminiKey: false,
		});
	});

	it("stores a Gemini key encrypted and only exposes hasGeminiKey", async () => {
		let storedCiphertext: string | null = null;
		vi.mocked(db.siteSetting.upsert).mockImplementation(async ({ create, update }) => {
			storedCiphertext = (update as { ciphertext: string }).ciphertext ?? create.ciphertext;
			return {} as never;
		});
		vi.mocked(db.siteSetting.findUnique).mockImplementation(async () =>
			storedCiphertext
				? ({ id: AI_PROVIDER_SETTING_ID, ciphertext: storedCiphertext } as never)
				: null,
		);

		await expect(
			writeAiProviderSettings({
				provider: "gemini",
				model: "gemini-1.5-flash",
				geminiApiKey: "secret-gemini-key",
			}),
		).resolves.toEqual({ ok: true });

		const summary = await readAiProviderSettings();
		expect(summary).toEqual({
			provider: "gemini",
			model: "gemini-1.5-flash",
			hasGeminiKey: true,
		});
		expect(JSON.stringify(summary)).not.toContain("secret-gemini-key");
		expect(storedCiphertext).toBeTruthy();
		expect(storedCiphertext).not.toContain("secret-gemini-key");
	});

	it("keeps the previous Gemini key when a write omits a new key", async () => {
		const secret = process.env.SETTINGS_ENCRYPTION_KEY!;
		const initialCiphertext = encryptSettingsJson(
			JSON.stringify({
				provider: "gemini",
				model: "gemini-1.5-flash",
				geminiApiKey: "keep-me",
			}),
			secret,
		);
		let storedCiphertext = initialCiphertext;
		vi.mocked(db.siteSetting.findUnique).mockImplementation(async () => ({
			id: AI_PROVIDER_SETTING_ID,
			ciphertext: storedCiphertext,
		}) as never);
		vi.mocked(db.siteSetting.upsert).mockImplementation(async ({ create, update }) => {
			storedCiphertext = (update as { ciphertext: string }).ciphertext ?? create.ciphertext;
			return {} as never;
		});

		await expect(
			writeAiProviderSettings({
				provider: "gemini",
				model: "gemini-2.0-flash",
			}),
		).resolves.toEqual({ ok: true });

		const { decryptSettingsJson } = await import("../../course/lib/settings-crypto");
		const parsed = JSON.parse(decryptSettingsJson(storedCiphertext, secret)!);
		expect(parsed).toMatchObject({
			provider: "gemini",
			model: "gemini-2.0-flash",
			geminiApiKey: "keep-me",
		});
		await expect(readAiProviderSettings()).resolves.toEqual({
			provider: "gemini",
			model: "gemini-2.0-flash",
			hasGeminiKey: true,
		});
	});

	it("returns null from resolution when SETTINGS_ENCRYPTION_KEY no longer matches", async () => {
		const ciphertext = encryptSettingsJson(
			JSON.stringify({
				provider: "gemini",
				model: "gemini-1.5-flash",
				geminiApiKey: "secret-gemini-key",
			}),
			"original-secret",
		);
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue({
			id: AI_PROVIDER_SETTING_ID,
			ciphertext,
		} as never);
		process.env.SETTINGS_ENCRYPTION_KEY = "rotated-secret";

		await expect(loadAiProviderResolution()).resolves.toBeNull();
	});
});
