import { describe, expect, it, vi } from "vitest";

import {
	AI_SUGGESTION_LABEL,
	BILLING_AUTO_REPLY,
	COOLIFY_UNAVAILABLE_INTERNAL_NOTE,
	DNS_AUTO_REPLY,
	NO_DEPLOYMENT_INTERNAL_NOTE,
	RESOLUTION_CONFIRM_PROMPT,
	runCopilot,
	type CoolifyReaders,
	type GenerateDiagnosis,
} from "./copilot";

const deployment = {
	id: "dep_1",
	tier: "managed",
	coolifyAppId: "app_1",
};

function readers(overrides?: Partial<CoolifyReaders>): CoolifyReaders {
	return {
		fetchCoolifyAppStatus: vi.fn().mockResolvedValue({
			kind: "ok",
			reachable: true,
			publicUrl: "https://buyer.example",
			lastDeployedAt: "2026-08-18T15:00:00Z",
		}),
		fetchCoolifyAppLogs: vi.fn().mockResolvedValue({
			kind: "ok",
			logs: "Ready",
		}),
		...overrides,
	};
}

describe("runCopilot", () => {
	it("skips Coolify and posts the no-deployment note when the ticket has no deployment", async () => {
		const coolify = readers();
		const generateDiagnosis = vi.fn() as unknown as GenerateDiagnosis;

		const result = await runCopilot({
			ticket: { buyerDeploymentId: null, status: "OPEN" },
			buyerMessage: "網站打不開",
			deployment: null,
			coolifyApiToken: "token",
			readers: coolify,
			generateDiagnosis,
		});

		expect(coolify.fetchCoolifyAppStatus).not.toHaveBeenCalled();
		expect(coolify.fetchCoolifyAppLogs).not.toHaveBeenCalled();
		expect(generateDiagnosis).not.toHaveBeenCalled();
		expect(result.internalNotes).toEqual([NO_DEPLOYMENT_INTERNAL_NOTE]);
		expect(result.buyerReply).toBeNull();
		expect(result.escalateToHuman).toBe(true);
	});

	it("posts a temporarily-unavailable note when Coolify is unreachable", async () => {
		const coolify = readers({
			fetchCoolifyAppStatus: vi.fn().mockResolvedValue({ kind: "network_error" }),
			fetchCoolifyAppLogs: vi.fn().mockResolvedValue({ kind: "network_error" }),
		});

		const result = await runCopilot({
			ticket: { buyerDeploymentId: "dep_1", status: "OPEN" },
			buyerMessage: "網站打不開",
			deployment,
			coolifyApiToken: "token",
			readers: coolify,
			generateDiagnosis: vi.fn().mockResolvedValue({
				confidence: "low",
				buyerReply: null,
				remediationSuggestion: null,
				appearsResolved: false,
			}),
		});

		expect(result.internalNotes).toContain(COOLIFY_UNAVAILABLE_INTERNAL_NOTE);
		expect(result.internalNotes.join("\n")).not.toMatch(/healthy|broken|壞掉|健康/i);
	});

	it("auto-replies for a known DNS issue and keeps remediation internal", async () => {
		const result = await runCopilot({
			ticket: { buyerDeploymentId: "dep_1", status: "OPEN" },
			buyerMessage: "DNS 未生效，NXDOMAIN",
			deployment,
			coolifyApiToken: "token",
			readers: readers(),
			generateDiagnosis: vi.fn(),
		});

		expect(result.buyerReply).toBe(DNS_AUTO_REPLY);
		expect(result.internalNotes.some((note) => note.startsWith(AI_SUGGESTION_LABEL))).toBe(true);
		expect(result.buyerReply).not.toContain(AI_SUGGESTION_LABEL);
	});

	it("auto-replies for a known billing issue", async () => {
		const result = await runCopilot({
			ticket: { buyerDeploymentId: "dep_1", status: "OPEN" },
			buyerMessage: "說我欠費 unpaid invoice",
			deployment,
			coolifyApiToken: "token",
			readers: readers(),
			generateDiagnosis: vi.fn(),
		});

		expect(result.buyerReply).toBe(BILLING_AUTO_REPLY);
	});

	it("leaves the ticket open and escalates when the model call fails", async () => {
		const result = await runCopilot({
			ticket: { buyerDeploymentId: "dep_1", status: "OPEN" },
			buyerMessage: "網站打不開",
			deployment,
			coolifyApiToken: "token",
			readers: readers(),
			generateDiagnosis: vi.fn().mockRejectedValue(new Error("timeout")),
		});

		expect(result.buyerReply).toBeNull();
		expect(result.escalateToHuman).toBe(true);
		expect(result.suggestResolved).toBe(false);
	});

	it("never copies the remediation suggestion into the buyer reply", async () => {
		const suggestion = "重啟 Coolify application uuid app_1";
		const result = await runCopilot({
			ticket: { buyerDeploymentId: "dep_1", status: "OPEN" },
			buyerMessage: "偶發 502",
			deployment,
			coolifyApiToken: "token",
			readers: readers(),
			generateDiagnosis: vi.fn().mockResolvedValue({
				confidence: "high",
				buyerReply: "先硬重新整理一次，我這邊看起來服務是活的。",
				remediationSuggestion: suggestion,
				appearsResolved: false,
			}),
		});

		expect(result.buyerReply).toContain("硬重新整理");
		expect(result.buyerReply).not.toContain(suggestion);
		expect(result.internalNotes.join("\n")).toContain(suggestion);
		expect(result.internalNotes.join("\n")).toContain(AI_SUGGESTION_LABEL);
	});

	it("posts a confirmation prompt when the issue appears resolved", async () => {
		const result = await runCopilot({
			ticket: { buyerDeploymentId: "dep_1", status: "OPEN" },
			buyerMessage: "好了謝謝",
			deployment,
			coolifyApiToken: "token",
			readers: readers(),
			generateDiagnosis: vi.fn().mockResolvedValue({
				confidence: "high",
				buyerReply: null,
				remediationSuggestion: null,
				appearsResolved: true,
			}),
		});

		expect(result.buyerReply).toBe(RESOLUTION_CONFIRM_PROMPT);
		expect(result.suggestResolved).toBe(true);
	});
});
