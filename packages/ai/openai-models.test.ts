import { openai } from "@ai-sdk/openai";
import { describe, expect, it } from "vitest";

import { OPENAI_TEXT_MODEL_OPTIONS } from "./lib/model-options";

describe("OPENAI_TEXT_MODEL_OPTIONS", () => {
	it("creates a model object for every listed OpenAI model id without throwing", () => {
		for (const modelId of OPENAI_TEXT_MODEL_OPTIONS) {
			expect(() => openai(modelId)).not.toThrow();
			const model = openai(modelId);
			expect(model.modelId).toBe(modelId);
			expect(model.provider).toContain("openai");
		}
	});
});
