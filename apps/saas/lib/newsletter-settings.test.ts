import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, upsert, decryptSettingsJson, encryptSettingsJson } = vi.hoisted(() => ({
	findUnique: vi.fn(),
	upsert: vi.fn(),
	decryptSettingsJson: vi.fn(),
	encryptSettingsJson: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({ db: { siteSetting: { findUnique, upsert } } }));
vi.mock("./settings-crypto", () => ({ decryptSettingsJson, encryptSettingsJson }));

import { getNewsletterSiteSettings, writeNewsletterSiteSettings } from "./newsletter-settings";

describe("newsletter SiteSetting", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("SETTINGS_ENCRYPTION_KEY", "settings-secret");
		findUnique.mockResolvedValue({ id: "newsletter", ciphertext: "encrypted" });
		decryptSettingsJson.mockReturnValue(JSON.stringify({ senderPhysicalAddress: "台北市中正區測試路 1 號" }));
		encryptSettingsJson.mockReturnValue("encrypted-next");
		upsert.mockResolvedValue({});
	});

	it("reads senderPhysicalAddress from the encrypted newsletter SiteSetting", async () => {
		await expect(getNewsletterSiteSettings()).resolves.toEqual({ senderPhysicalAddress: "台北市中正區測試路 1 號" });
		expect(findUnique).toHaveBeenCalledWith({ where: { id: "newsletter" } });
	});

	it("writes senderPhysicalAddress to the encrypted newsletter SiteSetting", async () => {
		await expect(writeNewsletterSiteSettings({
			actorUserId: "admin-1",
			settings: { senderPhysicalAddress: "台北市中正區測試路 1 號" },
		})).resolves.toEqual({ ok: true });
		expect(encryptSettingsJson).toHaveBeenCalledWith(
		JSON.stringify({ senderPhysicalAddress: "台北市中正區測試路 1 號" }),
		"settings-secret",
		);
		expect(upsert).toHaveBeenCalledWith({
			where: { id: "newsletter" },
			create: { id: "newsletter", ciphertext: "encrypted-next", updatedBy: "admin-1" },
			update: { ciphertext: "encrypted-next", updatedBy: "admin-1" },
		});
	});
});
