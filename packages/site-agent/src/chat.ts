import { createOpenAiProvider, resolveAgentProvider } from "./provider";
import { runAgentTool } from "./tools";
import type { AgentDataAccess, AgentProvider } from "./types";

const ALLOWED_TOOLS = ["get_my_orders", "get_my_course_progress"] as const;

export type ChatResult =
	| {
			ok: true;
			assistantMessage: string;
			toolTraces: Array<{ tool: string; data: unknown }>;
	  }
	| {
			ok: false;
			httpStatus: 401 | 400 | 503 | 502;
			error:
				| "authentication_required"
				| "empty_message"
				| "provider_not_configured"
				| "provider_failed";
	  };

const SYSTEM = `你是 StartKiter 站內助手。只能幫使用者看自己的訂單與課程進度摘要。不要假裝能改資料或查別人。客服請引導用 email。`;

export async function runSiteAgentChat(args: {
	userId: string | null | undefined;
	message: string;
	data: AgentDataAccess;
	env?: Record<string, string | undefined>;
	providerOverride?: AgentProvider | null;
	/** 測試用：強制先跑工具再餵給 provider */
	prefetchTools?: boolean;
}): Promise<ChatResult> {
	if (!args.userId) {
		return { ok: false, httpStatus: 401, error: "authentication_required" };
	}
	const message = args.message?.trim() ?? "";
	if (!message) {
		return { ok: false, httpStatus: 400, error: "empty_message" };
	}

	let provider: AgentProvider | null;
	if (args.providerOverride !== undefined) {
		provider = args.providerOverride;
	} else {
		const resolved = resolveAgentProvider(args.env ?? process.env);
		if (!resolved) {
			provider = null;
		} else if (resolved.name === "openai") {
			provider = createOpenAiProvider(resolved.apiKey);
		} else {
			// Gemini／Anthropic 尚未接真 API：不可靜默 echo 假裝 200
			return { ok: false, httpStatus: 503, error: "provider_not_configured" };
		}
	}

	if (!provider) {
		return { ok: false, httpStatus: 503, error: "provider_not_configured" };
	}

	const toolTraces: Array<{ tool: string; data: unknown }> = [];
	if (args.prefetchTools !== false) {
		for (const tool of ALLOWED_TOOLS) {
			const result = await runAgentTool({
				userId: args.userId,
				tool,
				data: args.data,
			});
			if (result.ok) {
				toolTraces.push({ tool: result.tool, data: result.data });
			}
		}
	}

	try {
		const { assistantMessage } = await provider.complete({
			message,
			system: `${SYSTEM}\n工具摘要：${JSON.stringify(toolTraces)}`,
		});
		return { ok: true, assistantMessage, toolTraces };
	} catch {
		return { ok: false, httpStatus: 502, error: "provider_failed" };
	}
}
