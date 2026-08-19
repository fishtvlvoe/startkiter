import { generateText, textModel } from "@startkiter/ai";

import type { Diagnosis, GenerateDiagnosis } from "./copilot";

const DIAGNOSIS_TIMEOUT_MS = 15_000;

export const defaultGenerateDiagnosis: GenerateDiagnosis = async (input) => {
	const { text } = await generateText({
		model: textModel,
		abortSignal: AbortSignal.timeout(DIAGNOSIS_TIMEOUT_MS),
		prompt: [
			"You are a StartKiter support diagnostic copilot.",
			"Reply with JSON only: {\"confidence\":\"high\"|\"low\",\"buyerReply\":string|null,\"remediationSuggestion\":string|null,\"appearsResolved\":boolean}.",
			"buyerReply is customer-facing and must never include unverified remediation steps.",
			"remediationSuggestion is for internal engineers only.",
			`Buyer message:\n${input.buyerMessage}`,
			`Coolify summary:\n${input.coolifySummary ?? "(none)"}`,
			`Logs:\n${input.logs ?? "(none)"}`,
		].join("\n\n"),
	});

	return parseDiagnosis(text);
};

function parseDiagnosis(text: string): Diagnosis {
	try {
		const jsonStart = text.indexOf("{");
		const jsonEnd = text.lastIndexOf("}");
		if (jsonStart < 0 || jsonEnd <= jsonStart) {
			return { confidence: "low", buyerReply: null, remediationSuggestion: null, appearsResolved: false };
		}
		const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Partial<Diagnosis>;
		const confidence = parsed.confidence === "high" ? "high" : "low";
		return {
			confidence,
			buyerReply: typeof parsed.buyerReply === "string" ? parsed.buyerReply : null,
			remediationSuggestion:
				typeof parsed.remediationSuggestion === "string" ? parsed.remediationSuggestion : null,
			appearsResolved: parsed.appearsResolved === true,
		};
	} catch {
		return { confidence: "low", buyerReply: null, remediationSuggestion: null, appearsResolved: false };
	}
}
