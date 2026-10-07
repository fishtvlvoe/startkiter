import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
	encryptSettingsJson,
} from "../../api/modules/course/lib/settings-crypto";
import {
	clearEmailSettingsCache,
	EMAIL_SETTINGS_ID,
	sendTestEmail,
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

describe("sendTestEmail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearEmailSettingsCache();
		process.env.SETTINGS_ENCRYPTION_KEY = TEST_SECRET;
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		clearEmailSettingsCache();
	});

	it("succeeds using saved provider settings", async () => {
		const payload = {
			provider: "tosend",
			tosendApiKey: "tsend_valid_1234",
			fromEmail: "admin@example.com",
			senderName: "StartKiter Admin",
		};
		const ciphertext = encryptSettingsJson(JSON.stringify(payload), TEST_SECRET);
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(siteSettingRow(ciphertext) as never);

		const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		const result = await sendTestEmail("fish@fishot.com");
		expect(result).toEqual({ ok: true, provider: "tosend" });
		expect(fetchMock).toHaveBeenCalledTimes(1);

		const callArgs = fetchMock.mock.calls[0];
		expect(callArgs?.[0]).toContain("/emails");
		const reqBody = JSON.parse(callArgs?.[1]?.body as string);
		expect(reqBody.to).toEqual([{ email: "fish@fishot.com" }]);
	});

	it("returns error with HTTP status and no plain-text secret on 401 failure", async () => {
		const SECRET_KEY = "tsend_super_secret_key_9999";
		const payload = {
			provider: "tosend",
			tosendApiKey: SECRET_KEY,
			fromEmail: "admin@example.com",
		};
		const ciphertext = encryptSettingsJson(JSON.stringify(payload), TEST_SECRET);
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(siteSettingRow(ciphertext) as never);

		const fetchMock = vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 }));
		vi.stubGlobal("fetch", fetchMock);

		const result = await sendTestEmail("fish@fishot.com");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("401");
			expect(result.error).not.toContain(SECRET_KEY);
		}
	});

	it("fails when no email provider settings are stored", async () => {
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);

		const result = await sendTestEmail("fish@fishot.com");
		expect(result).toEqual({ ok: false, error: "no_provider_configured" });
	});
});
