import { createDatabase } from "@startkiter/database";

import { decryptSettingsJson, encryptSettingsJson } from "./settings-crypto";
import {
	isClearPayuniPatch,
	mergePayuniSettings,
	validatePayuniPatch,
	type PayuniPlainSettings,
	type PayuniSettingsPatch,
} from "./payuni-settings";

export const PAYUNI_SETTING_ID = "payuni";

function encryptionKey(): string {
	return process.env.SETTINGS_ENCRYPTION_KEY ?? "";
}

function parsePlain(json: string): PayuniPlainSettings | null {
	try {
		const parsed: unknown = JSON.parse(json);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return null;
		}
		const row = parsed as Record<string, unknown>;
		return {
			merchantId: typeof row.merchantId === "string" ? row.merchantId : "",
			hashKey: typeof row.hashKey === "string" ? row.hashKey : "",
			hashIV: typeof row.hashIV === "string" ? row.hashIV : "",
			apiUrl: typeof row.apiUrl === "string" ? row.apiUrl : "",
		};
	} catch {
		return null;
	}
}

export async function readPayuniSettingsPlain(): Promise<PayuniPlainSettings | null> {
	const secret = encryptionKey();
	if (!secret.trim()) {
		return null;
	}
	try {
		const db = createDatabase();
		const row = await db.siteSetting.findUnique({ where: { id: PAYUNI_SETTING_ID } });
		if (!row) {
			return null;
		}
		const json = decryptSettingsJson(row.ciphertext, secret);
		if (!json) {
			console.error("site_setting payuni decrypt failed; falling back to env");
			return null;
		}
		return parsePlain(json);
	} catch (error) {
		console.error("site_setting payuni read failed; falling back to env", error);
		return null;
	}
}

export async function writePayuniSettings(args: {
	patch: PayuniSettingsPatch;
	actorUserId: string;
}): Promise<{ ok: true; settings: PayuniPlainSettings | null } | { ok: false; error: string; httpStatus: 400 | 503 }> {
	if (isClearPayuniPatch(args.patch)) {
		try {
			const db = createDatabase();
			await db.siteSetting.deleteMany({ where: { id: PAYUNI_SETTING_ID } });
			return { ok: true, settings: null };
		} catch (error) {
			console.error("site_setting payuni delete failed", error);
			return { ok: false, error: "settings_unavailable", httpStatus: 503 };
		}
	}

	const invalid = validatePayuniPatch(args.patch);
	if (invalid) {
		return { ok: false, error: invalid, httpStatus: 400 };
	}

	const secret = encryptionKey();
	if (!secret.trim()) {
		return { ok: false, error: "encryption_key_required", httpStatus: 503 };
	}

	const existing = await readPayuniSettingsPlain();
	const merged = mergePayuniSettings(existing, args.patch);
	if (!merged.merchantId || !merged.hashKey || !merged.hashIV) {
		return { ok: false, error: "incomplete_payuni_settings", httpStatus: 400 };
	}

	try {
		const ciphertext = encryptSettingsJson(JSON.stringify(merged), secret);
		const db = createDatabase();
		await db.siteSetting.upsert({
			where: { id: PAYUNI_SETTING_ID },
			create: {
				id: PAYUNI_SETTING_ID,
				ciphertext,
				updatedBy: args.actorUserId,
			},
			update: {
				ciphertext,
				updatedBy: args.actorUserId,
			},
		});
		return { ok: true, settings: merged };
	} catch (error) {
		console.error("site_setting payuni write failed", error);
		return { ok: false, error: "settings_unavailable", httpStatus: 503 };
	}
}
