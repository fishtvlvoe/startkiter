import { openai } from "@ai-sdk/openai";

export { resolveTextModel } from "./lib/provider-settings";
export {
	AI_PROVIDER_SETTING_ID,
	DEFAULT_AI_PROVIDER_SETTINGS,
	isKnownAiTextModel,
	readAiProviderSettings,
	writeAiProviderSettings,
	type AiProvider,
	type AiProviderSettingsSummary,
} from "./lib/provider-settings";

export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");

export * from "ai";
export * from "./lib";
