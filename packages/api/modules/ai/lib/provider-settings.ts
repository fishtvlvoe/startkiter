import { db } from "@startkiter/database";

import { decryptSettingsJson, encryptSettingsJson } from "../../course/lib/settings-crypto";

export const AI_PROVIDER_SETTING_ID = "ai-provider-config";

export type AiProvider = "openai" | "gemini";

export type AiProviderSettingsSummary = {
	provider: AiProvider;
	model: string;
	hasGeminiKey: boolean;
};

type StoredAiProviderSettings = {
	provider?: AiProvider;
	model?: string;
	geminiApiKey?: string;
};

export const DEFAULT_AI_PROVIDER_SETTINGS: AiProviderSettingsSummary = {
	provider: "openai",
	model: "gpt-4o-mini",
	hasGeminiKey: false,
};

function encryptionKey(): string {
	return process.env.SETTINGS_ENCRYPTION_KEY ?? "";
}

function isProvider(value: unknown): value is AiProvider {
	return value === "openai" || value === "gemini";
}

function parseStoredSettings(json: string | null): StoredAiProviderSettings {
	if (!json) {
		return {};
	}

	try {
		const value: unknown = JSON.parse(json);
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			return {};
		}
		return value as StoredAiProviderSettings;
	} catch {
		return {};
	}
}

async function readStoredSettings(): Promise<StoredAiProviderSettings> {
	const secret = encryptionKey();
	if (!secret.trim()) {
		return {};
	}

	try {
		const row = await db.siteSetting.findUnique({ where: { id: AI_PROVIDER_SETTING_ID } });
		if (!row) {
			return {};
		}
		return parseStoredSettings(decryptSettingsJson(row.ciphertext, secret));
	} catch {
		return {};
	}
}

function toSummary(stored: StoredAiProviderSettings): AiProviderSettingsSummary {
	const provider = isProvider(stored.provider) ? stored.provider : DEFAULT_AI_PROVIDER_SETTINGS.provider;
	const model =
		typeof stored.model === "string" && stored.model.trim()
			? stored.model.trim()
			: DEFAULT_AI_PROVIDER_SETTINGS.model;

	return {
		provider,
		model,
		hasGeminiKey: typeof stored.geminiApiKey === "string" && stored.geminiApiKey.length > 0,
	};
}

export async function readAiProviderSettings(): Promise<AiProviderSettingsSummary> {
	return toSummary(await readStoredSettings());
}

/**
 * Internal resolver helper — returns the decrypted Gemini key when present.
 * Callers must never serialize this into API responses or page props.
 */
export async function loadAiProviderResolution(): Promise<{
	provider: AiProvider;
	model: string;
	geminiApiKey: string | null;
} | null> {
	const secret = encryptionKey();
	if (!secret.trim()) {
		return null;
	}

	try {
		const row = await db.siteSetting.findUnique({ where: { id: AI_PROVIDER_SETTING_ID } });
		if (!row) {
			return null;
		}

		const json = decryptSettingsJson(row.ciphertext, secret);
		if (!json) {
			return null;
		}

		const stored = parseStoredSettings(json);
		if (!isProvider(stored.provider)) {
			return null;
		}

		const model =
			typeof stored.model === "string" && stored.model.trim()
				? stored.model.trim()
				: DEFAULT_AI_PROVIDER_SETTINGS.model;

		return {
			provider: stored.provider,
			model,
			geminiApiKey:
				typeof stored.geminiApiKey === "string" && stored.geminiApiKey.length > 0
					? stored.geminiApiKey
					: null,
		};
	} catch {
		return null;
	}
}

export async function writeAiProviderSettings(args: {
	provider: AiProvider;
	model: string;
	geminiApiKey?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
	const secret = encryptionKey();
	if (!secret.trim()) {
		return { ok: false, error: "encryption_key_required" };
	}

	const model = args.model.trim();
	if (!model) {
		return { ok: false, error: "model_required" };
	}

	if (!isProvider(args.provider)) {
		return { ok: false, error: "invalid_provider" };
	}

	const previous = await readStoredSettings();
	const nextKey = args.geminiApiKey?.trim();
	const next: StoredAiProviderSettings = {
		provider: args.provider,
		model,
		geminiApiKey: nextKey ? nextKey : previous.geminiApiKey,
	};

	try {
		const ciphertext = encryptSettingsJson(JSON.stringify(next), secret);
		await db.siteSetting.upsert({
			where: { id: AI_PROVIDER_SETTING_ID },
			create: { id: AI_PROVIDER_SETTING_ID, ciphertext },
			update: { ciphertext },
		});
		return { ok: true };
	} catch {
		return { ok: false, error: "settings_unavailable" };
	}
}
