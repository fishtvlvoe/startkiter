import { db } from "@startkiter/database";
import {
	NEWSLETTER_SITE_SETTING_ID,
	parseNewsletterSiteSettings,
	serializeNewsletterSiteSettings,
	type NewsletterSiteSettings,
} from "@startkiter/newsletter";

import { decryptSettingsJson, encryptSettingsJson } from "./settings-crypto";

function encryptionKey(): string {
	return process.env.SETTINGS_ENCRYPTION_KEY ?? "";
}

export async function getNewsletterSiteSettings(): Promise<NewsletterSiteSettings> {
	const secret = encryptionKey();
	if (!secret.trim()) return { senderPhysicalAddress: "" };

	try {
		const row = await db.siteSetting.findUnique({ where: { id: NEWSLETTER_SITE_SETTING_ID } });
		return parseNewsletterSiteSettings(row ? decryptSettingsJson(row.ciphertext, secret) : null);
	} catch (error) {
		console.error("site_setting newsletter read failed", error);
		return { senderPhysicalAddress: "" };
	}
}

export async function writeNewsletterSiteSettings(args: {
	settings: NewsletterSiteSettings;
	actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
	const secret = encryptionKey();
	if (!secret.trim()) return { ok: false, error: "encryption_key_required" };

	try {
		const ciphertext = encryptSettingsJson(serializeNewsletterSiteSettings(args.settings), secret);
		await db.siteSetting.upsert({
			where: { id: NEWSLETTER_SITE_SETTING_ID },
			create: { id: NEWSLETTER_SITE_SETTING_ID, ciphertext, updatedBy: args.actorUserId },
			update: { ciphertext, updatedBy: args.actorUserId },
		});
		return { ok: true };
	} catch (error) {
		console.error("site_setting newsletter write failed", error);
		return { ok: false, error: "settings_unavailable" };
	}
}
