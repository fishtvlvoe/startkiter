import type { AgentProvider } from "./types";

export function resolveAgentProvider(
	env: Record<string, string | undefined>,
): { name: "openai" | "gemini" | "anthropic"; apiKey: string } | null {
	const openai = env.OPENAI_API_KEY?.trim();
	if (openai) {
		return { name: "openai", apiKey: openai };
	}
	const gemini = env.GEMINI_API_KEY?.trim();
	if (gemini) {
		return { name: "gemini", apiKey: gemini };
	}
	const anthropic = env.ANTHROPIC_API_KEY?.trim() ?? env.CLAUDE_API_KEY?.trim();
	if (anthropic) {
		return { name: "anthropic", apiKey: anthropic };
	}
	return null;
}

/** 測試／離線用：不打外網，可嵌入工具摘要。 */
export function createEchoProvider(toolSummary?: string): AgentProvider {
	return {
		async complete({ message }) {
			const suffix = toolSummary ? `\n[tools] ${toolSummary}` : "";
			return { assistantMessage: `收到：${message}${suffix}` };
		},
	};
}

export function createOpenAiProvider(apiKey: string): AgentProvider {
	return {
		async complete({ message, system }) {
			const res = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "gpt-4o-mini",
					messages: [
						{ role: "system", content: system },
						{ role: "user", content: message },
					],
				}),
			});
			if (!res.ok) {
				throw new Error(`openai_failed:${res.status}`);
			}
			const body = (await res.json()) as {
				choices?: Array<{ message?: { content?: string } }>;
			};
			const text = body.choices?.[0]?.message?.content?.trim();
			if (!text) {
				throw new Error("openai_empty");
			}
			return { assistantMessage: text };
		},
	};
}
