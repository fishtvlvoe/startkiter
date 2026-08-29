import { db } from "@startkiter/database";

import { decryptSettingsJson, encryptSettingsJson } from "./settings-crypto";

export const GEMINI_SETTING_ID = "gemini-notes";

export function getGeminiSettingId(instructorId: string): string {
	return `${GEMINI_SETTING_ID}:${instructorId}`;
}

function encryptionKey(): string {
	return process.env.SETTINGS_ENCRYPTION_KEY ?? "";
}

export async function readGeminiApiKey(instructorId: string): Promise<string | null> {
	const secret = encryptionKey();
	if (!secret.trim()) {
		return null;
	}

	try {
		const row = await db.siteSetting.findUnique({ where: { id: getGeminiSettingId(instructorId) } });
		if (!row) {
			return null;
		}
		const json = decryptSettingsJson(row.ciphertext, secret);
		if (!json) {
			return null;
		}
		const parsed: unknown = JSON.parse(json);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return null;
		}
		const apiKey = (parsed as { apiKey?: unknown }).apiKey;
		return typeof apiKey === "string" && apiKey.length > 0 ? apiKey : null;
	} catch {
		return null;
	}
}

export async function writeGeminiApiKey(instructorId: string, key: string): Promise<{ ok: boolean; error?: string }> {
	if (!key.trim()) {
		return { ok: false, error: "api_key_required" };
	}

	const secret = encryptionKey();
	if (!secret.trim()) {
		return { ok: false, error: "encryption_key_required" };
	}

	try {
		const ciphertext = encryptSettingsJson(JSON.stringify({ apiKey: key }), secret);
		await db.siteSetting.upsert({
			where: { id: getGeminiSettingId(instructorId) },
			create: { id: getGeminiSettingId(instructorId), ciphertext },
			update: { ciphertext },
		});
		return { ok: true };
	} catch {
		return { ok: false, error: "settings_unavailable" };
	}
}
