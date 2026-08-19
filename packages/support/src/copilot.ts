import type { CoolifyStatusProbe } from "@startkiter/platform";

export const NO_DEPLOYMENT_INTERNAL_NOTE = "無部署資料，人工直接處理";

export const COOLIFY_UNAVAILABLE_INTERNAL_NOTE = "部署狀態暫時無法取得";

export const AI_SUGGESTION_LABEL = "AI 建議、未經驗證";

export const RESOLUTION_CONFIRM_PROMPT =
	"看起來問題可能已經解決。若已修好，請回覆確認；若還沒好，直接回覆你現在看到的狀況。";

export const DNS_AUTO_REPLY =
	"你的網域 DNS 還沒指到這台機器。請到域名商把 A 記錄指到部署頁面上的 IP，等 DNS 生效（通常幾分鐘到幾小時）。";

export const BILLING_AUTO_REPLY =
	"目前看起來帳務／方案可能未完成付款，部署會被暫停。請先確認付款狀態後再回覆我們。";

export type KnownIssue = "dns" | "billing";

export type Diagnosis = {
	confidence: "high" | "low";
	buyerReply: string | null;
	remediationSuggestion: string | null;
	appearsResolved: boolean;
};

export type GenerateDiagnosis = (input: {
	buyerMessage: string;
	coolifySummary: string | null;
	logs: string | null;
}) => Promise<Diagnosis>;

export type CoolifyReaders = {
	fetchCoolifyAppStatus: (coolifyAppId: string, apiToken: string) => Promise<CoolifyStatusProbe>;
	fetchCoolifyAppLogs: (coolifyAppId: string, apiToken: string) => Promise<CoolifyLogProbe>;
};

export type CoolifyLogProbe =
	| { kind: "ok"; logs: string }
	| { kind: "api_error" }
	| { kind: "network_error" };

export type CopilotTicket = {
	buyerDeploymentId: string | null;
	status: "OPEN" | "AI_SUGGESTED_RESOLVED" | "RESOLVED" | "ESCALATED";
};

export type CopilotDeployment = {
	id: string;
	tier: string;
	coolifyAppId?: string;
};

export type CopilotResult = {
	buyerReply: string | null;
	internalNotes: string[];
	escalateToHuman: boolean;
	suggestResolved: boolean;
};

const DNS_PATTERN = /nxdomain|servfail|dns\s*(not|未)|未生效|domain\s+not\s+resolv/i;

const BILLING_PATTERN = /unpaid|past due|payment required|欠費|invoice overdue|billing hold/i;

export function detectKnownIssue(buyerMessage: string, logs: string | null): KnownIssue | null {
	const haystack = `${buyerMessage}\n${logs ?? ""}`;
	if (DNS_PATTERN.test(haystack)) {
		return "dns";
	}
	if (BILLING_PATTERN.test(haystack)) {
		return "billing";
	}
	return null;
}

export function formatRemediationNote(suggestion: string): string {
	return `${AI_SUGGESTION_LABEL}\n${suggestion}`;
}

function summarizeCoolify(probe: CoolifyStatusProbe, logs: CoolifyLogProbe | null): string | null {
	if (probe.kind !== "ok") {
		return null;
	}
	const logText = logs?.kind === "ok" ? logs.logs.slice(0, 4000) : "";
	return [
		`reachable=${probe.reachable}`,
		`publicUrl=${probe.publicUrl}`,
		probe.lastDeployedAt ? `lastDeployedAt=${probe.lastDeployedAt}` : null,
		logText ? `logs:\n${logText}` : null,
	]
		.filter(Boolean)
		.join("\n");
}

export async function runCopilot(args: {
	ticket: CopilotTicket;
	buyerMessage: string;
	deployment: CopilotDeployment | null;
	coolifyApiToken: string | undefined;
	readers: CoolifyReaders;
	generateDiagnosis: GenerateDiagnosis;
}): Promise<CopilotResult> {
	const notes: string[] = [];

	if (!args.ticket.buyerDeploymentId || !args.deployment) {
		return {
			buyerReply: null,
			internalNotes: [NO_DEPLOYMENT_INTERNAL_NOTE],
			escalateToHuman: true,
			suggestResolved: false,
		};
	}

	let coolifySummary: string | null = null;
	let logsText: string | null = null;

	const appId = args.deployment.coolifyAppId;
	const token = args.coolifyApiToken?.trim();
	const canReadCoolify = args.deployment.tier === "managed" && Boolean(appId) && Boolean(token);

	if (canReadCoolify && appId && token) {
		const [statusProbe, logProbe] = await Promise.all([
			args.readers.fetchCoolifyAppStatus(appId, token),
			args.readers.fetchCoolifyAppLogs(appId, token),
		]);

		if (statusProbe.kind !== "ok") {
			notes.push(COOLIFY_UNAVAILABLE_INTERNAL_NOTE);
		} else {
			coolifySummary = summarizeCoolify(statusProbe, logProbe);
			if (coolifySummary) {
				notes.push(coolifySummary);
			}
		}

		if (logProbe.kind !== "ok") {
			if (statusProbe.kind === "ok") {
				notes.push(COOLIFY_UNAVAILABLE_INTERNAL_NOTE);
			}
		} else {
			logsText = logProbe.logs;
		}
	}

	const knownIssue = detectKnownIssue(args.buyerMessage, logsText);
	if (knownIssue === "dns") {
		notes.push(formatRemediationNote("確認域名 A 記錄是否指向部署 IP，並等待 DNS TTL 過期。"));
		return {
			buyerReply: DNS_AUTO_REPLY,
			internalNotes: notes,
			escalateToHuman: false,
			suggestResolved: false,
		};
	}
	if (knownIssue === "billing") {
		notes.push(formatRemediationNote("核對買家付款狀態與 Coolify 帳務是否因欠費停機。"));
		return {
			buyerReply: BILLING_AUTO_REPLY,
			internalNotes: notes,
			escalateToHuman: false,
			suggestResolved: false,
		};
	}

	let diagnosis: Diagnosis;
	try {
		diagnosis = await args.generateDiagnosis({
			buyerMessage: args.buyerMessage,
			coolifySummary,
			logs: logsText,
		});
	} catch {
		return {
			buyerReply: null,
			internalNotes: notes,
			escalateToHuman: true,
			suggestResolved: false,
		};
	}

	if (diagnosis.remediationSuggestion) {
		notes.push(formatRemediationNote(diagnosis.remediationSuggestion));
	}

	if (diagnosis.appearsResolved) {
		return {
			buyerReply: RESOLUTION_CONFIRM_PROMPT,
			internalNotes: notes,
			escalateToHuman: false,
			suggestResolved: true,
		};
	}

	if (diagnosis.confidence === "high" && diagnosis.buyerReply) {
		return {
			buyerReply: diagnosis.buyerReply,
			internalNotes: notes,
			escalateToHuman: false,
			suggestResolved: false,
		};
	}

	return {
		buyerReply: null,
		internalNotes: notes,
		escalateToHuman: true,
		suggestResolved: false,
	};
}
