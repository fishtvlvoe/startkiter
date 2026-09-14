import { openai } from "@ai-sdk/openai";

import { loadAiProviderResolution } from "../api/modules/ai/lib/provider-settings";

const FALLBACK_TEXT_MODEL_ID = "gpt-4o-mini";

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
			return openai(config.model || FALLBACK_TEXT_MODEL_ID);
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

export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");

export * from "ai";
export * from "./lib";
