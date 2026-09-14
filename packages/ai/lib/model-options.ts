/**
 * OpenAI text model IDs accepted by `@ai-sdk/openai@^4.0.42` via `openai(modelId)`.
 * Verified by constructing a model object for each id (see openai-models.test.ts).
 */
export const OPENAI_TEXT_MODEL_OPTIONS = [
	"gpt-4o-mini",
	"gpt-4o",
	"gpt-4.1-mini",
	"gpt-4.1",
	"o4-mini",
] as const;

export type OpenAiTextModelId = (typeof OPENAI_TEXT_MODEL_OPTIONS)[number];

/**
 * Gemini text model IDs accepted by `@ai-sdk/google@^4.0.42` via `createGoogleGenerativeAI(...)(modelId)`.
 */
export const GEMINI_TEXT_MODEL_OPTIONS = [
	"gemini-2.5-flash",
	"gemini-2.0-flash",
	"gemini-1.5-flash",
] as const;

export type GeminiTextModelId = (typeof GEMINI_TEXT_MODEL_OPTIONS)[number];
