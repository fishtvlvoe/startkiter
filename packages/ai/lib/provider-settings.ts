import { openai } from "@ai-sdk/openai";
import { db } from "@startkiter/database";

import { decryptSettingsJson, encryptSettingsJson } from "../../api/modules/course/lib/settings-crypto";
import {
	GEMINI_TEXT_MODEL_OPTIONS,
	OPENAI_TEXT_MODEL_OPTIONS,
} from "./model-options";

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

const FALLBACK_TEXT_MODEL_ID = DEFAULT_AI_PROVIDER_SETTINGS.model;

function encryptionKey(): string {
	return process.env.SETTINGS_ENCRYPTION_KEY ?? "";
}

function isProvider(value: unknown): value is AiProvider {
	return value === "openai" || value === "gemini";
}

export function isKnownAiTextModel(provider: AiProvider, model: string): boolean {
	const trimmed = model.trim();
	if (provider === "openai") {
		return (OPENAI_TEXT_MODEL_OPTIONS as readonly string[]).includes(trimmed);
	}
	return (GEMINI_TEXT_MODEL_OPTIONS as readonly string[]).includes(trimmed);
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

export async function readAiProviderSettings(): Promise<AiProviderSettingsSummary> {
	const stored = await readStoredSettings();
	const hasGeminiKey = typeof stored.geminiApiKey === "string" && stored.geminiApiKey.length > 0;

	if (!isProvider(stored.provider)) {
		return {
			...DEFAULT_AI_PROVIDER_SETTINGS,
			hasGeminiKey,
		};
	}

	if (typeof stored.model !== "string" || !isKnownAiTextModel(stored.provider, stored.model)) {
		return {
			provider: stored.provider,
			model: DEFAULT_AI_PROVIDER_SETTINGS.model,
			hasGeminiKey,
		};
	}

	return {
		provider: stored.provider,
		model: stored.model.trim(),
		hasGeminiKey,
	};
}

/**
 * Internal only — returns the decrypted Gemini key when present.
 * Not exported: keep plaintext key off the public module surface.
 */
async function loadAiProviderResolution(): Promise<{
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

		if (typeof stored.model !== "string" || !isKnownAiTextModel(stored.provider, stored.model)) {
			return null;
		}

		return {
			provider: stored.provider,
			model: stored.model.trim(),
			geminiApiKey:
				typeof stored.geminiApiKey === "string" && stored.geminiApiKey.length > 0
					? stored.geminiApiKey
					: null,
		};
	} catch {
		return null;
	}
}

function fallbackTextModel() {
	return openai(FALLBACK_TEXT_MODEL_ID);
}

/**
 * Resolve the site-wide AI assistant text model at request time.
 * Missing/invalid config or Gemini key decryption failure falls back to gpt-4o-mini.
 */
export async function resolveTextModel() {
	try {
		const config = await loadAiProviderResolution();
		if (!config) {
			return fallbackTextModel();
		}

		if (config.provider === "openai") {
			return openai(config.model);
		}

		if (config.provider === "gemini") {
			if (!config.geminiApiKey) {
				console.warn(
					"[ai] Gemini provider selected but API key missing/undecryptable; falling back to openai gpt-4o-mini",
				);
				return fallbackTextModel();
			}

			const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
			const google = createGoogleGenerativeAI({ apiKey: config.geminiApiKey });
			return google(config.model);
		}

		return fallbackTextModel();
	} catch (error) {
		console.warn("[ai] resolveTextModel failed; falling back to openai gpt-4o-mini", error);
		return fallbackTextModel();
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

	if (!isKnownAiTextModel(args.provider, model)) {
		return { ok: false, error: "invalid_model" };
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
