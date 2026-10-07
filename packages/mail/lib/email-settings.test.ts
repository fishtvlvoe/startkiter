import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		siteSetting: {
			findUnique: vi.fn(),
			upsert: vi.fn(),
		},
	},
}));

import { db } from "@startkiter/database";
import {
	decryptSettingsJson,
	encryptSettingsJson,
} from "../../api/modules/course/lib/settings-crypto";
import {
	EMAIL_SETTINGS_ID,
	getEmailSettingsSummary,
	readEmailSettings,
	saveEmailSettings,
} from "./email-settings";

const TEST_SECRET = "test-settings-encryption-secret-key-32b";

function siteSettingRow(ciphertext: string) {
	return {
		id: EMAIL_SETTINGS_ID,
		ciphertext,
		updatedAt: new Date("2026-10-06T00:00:00.000Z"),
		updatedBy: null,
	};
}

describe("email settings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.SETTINGS_ENCRYPTION_KEY = TEST_SECRET;
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);
		vi.mocked(db.siteSetting.upsert).mockResolvedValue(
			siteSettingRow("mock-ciphertext") as never,
		);
	});

	describe("Platform admin saves email provider settings", () => {
		it("saves ToSend credentials as encrypted ciphertext in db and returns { ok: true }", async () => {
			let storedCiphertext = "";
			vi.mocked(db.siteSetting.upsert).mockImplementation((async ({ create, update }: any) => {
				storedCiphertext = update?.ciphertext ?? create?.ciphertext;
				return siteSettingRow(storedCiphertext);
			}) as never);

			const result = await saveEmailSettings({
				provider: "tosend",
				tosendApiKey: "tsend_abcd1234",
			});

			expect(result).toEqual({ ok: true });
			expect(db.siteSetting.upsert).toHaveBeenCalledTimes(1);

			const upsertCall = vi.mocked(db.siteSetting.upsert).mock.calls[0]?.[0];
			expect(upsertCall?.where).toEqual({ id: EMAIL_SETTINGS_ID });
			expect(upsertCall?.create?.id).toBe(EMAIL_SETTINGS_ID);

			const ciphertext = upsertCall?.update?.ciphertext ?? upsertCall?.create?.ciphertext;
			expect(ciphertext).toBeTruthy();
			expect(ciphertext).not.toContain("tsend_abcd1234");

			const decrypted = decryptSettingsJson(ciphertext as string, TEST_SECRET);
			expect(decrypted).not.toBeNull();
			const parsed = JSON.parse(decrypted!);
			expect(parsed).toMatchObject({
				provider: "tosend",
				tosendApiKey: "tsend_abcd1234",
			});
		});

		it("keeps previously stored credentials when empty string is submitted", async () => {
			const initialCiphertext = encryptSettingsJson(
				JSON.stringify({
					provider: "tosend",
					tosendApiKey: "existing_key_1234",
				}),
				TEST_SECRET,
			);
			vi.mocked(db.siteSetting.findUnique).mockResolvedValue(
				siteSettingRow(initialCiphertext) as never,
			);

			let storedCiphertext = "";
			vi.mocked(db.siteSetting.upsert).mockImplementation((async ({ create, update }: any) => {
				storedCiphertext = update?.ciphertext ?? create?.ciphertext;
				return siteSettingRow(storedCiphertext);
			}) as never);

			const result = await saveEmailSettings({
				provider: "tosend",
				tosendApiKey: "",
			});

			expect(result).toEqual({ ok: true });
			expect(db.siteSetting.upsert).toHaveBeenCalledTimes(1);

			const upsertCall = vi.mocked(db.siteSetting.upsert).mock.calls[0]?.[0];
			const ciphertext = upsertCall?.update?.ciphertext ?? upsertCall?.create?.ciphertext;
			const decrypted = decryptSettingsJson(ciphertext as string, TEST_SECRET);
			expect(decrypted).not.toBeNull();
			const parsed = JSON.parse(decrypted!);
			expect(parsed.tosendApiKey).toBe("existing_key_1234");
		});

		it("returns { ok: false, error: 'settings_unavailable' } and does not write to DB when SETTINGS_ENCRYPTION_KEY is empty", async () => {
			process.env.SETTINGS_ENCRYPTION_KEY = "";

			const result = await saveEmailSettings({
				provider: "tosend",
				tosendApiKey: "tsend_abcd1234",
			});

			expect(result).toEqual({ ok: false, error: "settings_unavailable" });
			expect(db.siteSetting.upsert).not.toHaveBeenCalled();
		});
	});

	describe("Settings input validation boundaries", () => {
		it("rejects smtpPort: 0 with invalid_input", async () => {
			const result = await saveEmailSettings({ smtpPort: 0 });
			expect(result).toEqual({ ok: false, error: "invalid_input" });
			expect(db.siteSetting.upsert).not.toHaveBeenCalled();
		});

		it("accepts smtpPort: 65535 with ok: true", async () => {
			const result = await saveEmailSettings({ smtpPort: 65535 });
			expect(result).toEqual({ ok: true });
			expect(db.siteSetting.upsert).toHaveBeenCalledTimes(1);
		});

		it("rejects smtpPort: 65536 with invalid_input", async () => {
			const result = await saveEmailSettings({ smtpPort: 65536 });
			expect(result).toEqual({ ok: false, error: "invalid_input" });
			expect(db.siteSetting.upsert).not.toHaveBeenCalled();
		});

		it("accepts newsletterRatePerMinute: 600 with ok: true", async () => {
			const result = await saveEmailSettings({ newsletterRatePerMinute: 600 });
			expect(result).toEqual({ ok: true });
			expect(db.siteSetting.upsert).toHaveBeenCalledTimes(1);
		});

		it("rejects newsletterRatePerMinute: 601 with invalid_input", async () => {
			const result = await saveEmailSettings({ newsletterRatePerMinute: 601 });
			expect(result).toEqual({ ok: false, error: "invalid_input" });
			expect(db.siteSetting.upsert).not.toHaveBeenCalled();
		});

		it("rejects fromEmail: 'not-an-email' with invalid_input", async () => {
			const result = await saveEmailSettings({ fromEmail: "not-an-email" });
			expect(result).toEqual({ ok: false, error: "invalid_input" });
			expect(db.siteSetting.upsert).not.toHaveBeenCalled();
		});

		it("accepts fromEmail: '' with ok: true", async () => {
			const result = await saveEmailSettings({ fromEmail: "" });
			expect(result).toEqual({ ok: true });
			expect(db.siteSetting.upsert).toHaveBeenCalledTimes(1);
		});
	});

	describe("Stored secrets are never returned in plain text", () => {
		it("summary JSON does not contain plain text key, has hint ending with '1234', and hasTosendApiKey is true", async () => {
			const initialCiphertext = encryptSettingsJson(
				JSON.stringify({
					provider: "tosend",
					tosendApiKey: "tsend_abcd1234",
				}),
				TEST_SECRET,
			);
			vi.mocked(db.siteSetting.findUnique).mockResolvedValue(
				siteSettingRow(initialCiphertext) as never,
			);

			await saveEmailSettings({
				provider: "tosend",
				tosendApiKey: "tsend_abcd1234",
			});

			const summary = await getEmailSettingsSummary();
			expect(summary.hasTosendApiKey).toBe(true);
			expect(summary.tosendApiKeyHint?.endsWith("1234")).toBe(true);
			expect(JSON.stringify(summary)).not.toContain("tsend_abcd1234");
			expect((summary as Record<string, unknown>).tosendApiKey).toBeUndefined();
		});

		it("summary returns hasTosendApiKey as false when no key stored", async () => {
			vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);

			const summary = await getEmailSettingsSummary();
			expect(summary.hasTosendApiKey).toBe(false);
			expect(summary.tosendApiKeyHint).toBeFalsy();
		});
	});

	describe("Stored settings cache", () => {
		it("readEmailSettings uses in-process cache and saveEmailSettings invalidates cache", async () => {
			let currentPayload = {
				provider: "tosend",
				tosendApiKey: "tsend_abcd1234",
			};
			vi.mocked(db.siteSetting.findUnique).mockImplementation(
				(async () =>
					siteSettingRow(encryptSettingsJson(JSON.stringify(currentPayload), TEST_SECRET))) as never,
			);
			vi.mocked(db.siteSetting.upsert).mockImplementation((async ({ create, update }: any) => {
				const ciphertext = update?.ciphertext ?? create?.ciphertext;
				const decrypted = decryptSettingsJson(ciphertext as string, TEST_SECRET);
				if (decrypted) {
					currentPayload = JSON.parse(decrypted);
				}
				return siteSettingRow(ciphertext);
			}) as never);

			// 1. Initial read should fetch from DB
			const firstRead = await readEmailSettings();
			expect(firstRead.provider).toBe("tosend");
			expect(db.siteSetting.findUnique).toHaveBeenCalledTimes(1);

			// 2. Second read should hit in-process cache, findUnique not called again
			const secondRead = await readEmailSettings();
			expect(secondRead.provider).toBe("tosend");
			expect(db.siteSetting.findUnique).toHaveBeenCalledTimes(1);

			// 3. saveEmailSettings should succeed and clear cache
			const saveResult = await saveEmailSettings({
				provider: "resend",
				resendApiKey: "re_xyz9876",
			});
			expect(saveResult).toEqual({ ok: true });

			// 4. Subsequent read should re-query DB to obtain latest settings
			const dbCallsBefore = vi.mocked(db.siteSetting.findUnique).mock.calls.length;
			const thirdRead = await readEmailSettings();
			expect(thirdRead.provider).toBe("resend");
			expect(vi.mocked(db.siteSetting.findUnique).mock.calls.length).toBeGreaterThan(dbCallsBefore);
		});

		it("returns {} when no siteSetting row exists", async () => {
			vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);
			const settings = await readEmailSettings();
			expect(settings).toEqual({});
		});

		it("returns {} and does not throw when decryption fails", async () => {
			vi.mocked(db.siteSetting.findUnique).mockResolvedValue(
				siteSettingRow("invalid-ciphertext") as never,
			);
			const settings = await readEmailSettings();
			expect(settings).toEqual({});
		});
	});
});
