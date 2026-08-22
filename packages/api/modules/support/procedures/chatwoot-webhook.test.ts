import { call, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		supportTicket: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
		},
		buyerDeployment: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/logs", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		log: vi.fn(),
	},
}));

vi.mock("@startkiter/ai", () => ({
	generateText: vi.fn().mockResolvedValue({
		text: '{"confidence":"low","buyerReply":null,"remediationSuggestion":null,"appearsResolved":false}',
	}),
	textModel: {},
}));

vi.mock("@startkiter/platform", () => ({
	fetchCoolifyAppStatus: vi.fn().mockResolvedValue({ kind: "network_error" }),
	fetchCoolifyAppLogs: vi.fn().mockResolvedValue({ kind: "network_error" }),
}));

import { db } from "@startkiter/database";

import { chatwootWebhook, processChatwootWebhook } from "./chatwoot-webhook";

const SECRET = "chatwoot-webhook-secret";

const ticket = {
	id: "tkt_1",
	userId: "user-1",
	buyerDeploymentId: "dep_1",
	chatwootConversationId: 42,
	channel: "WEB_WIDGET" as const,
	status: "OPEN" as const,
	aiSuggestedResolvedAt: null,
	resolvedAt: null,
	resolvedBy: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const deployment = {
	id: "dep_1",
	userId: "user-1",
	tier: "managed" as const,
	coolifyAppId: "app_1",
};

function webhookUrl(token: string): string {
	return `https://startkiter.dev/api/support/webhook/chatwoot?token=${encodeURIComponent(token)}`;
}

function signedCall(payload: Record<string, unknown>) {
	const rawBody = JSON.stringify(payload);
	return { rawBody, url: webhookUrl(SECRET), payload };
}

describe("POST /support/webhook/chatwoot", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.CHATWOOT_WEBHOOK_SECRET = SECRET;
		process.env.COOLIFY_API_TOKEN = "coolify-token";
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(null);
		vi.mocked(db.supportTicket.create).mockResolvedValue(ticket);
		vi.mocked(db.supportTicket.update).mockResolvedValue(ticket);
		vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-1", email: "buyer@example.com" } as never);
		vi.mocked(db.buyerDeployment.findMany).mockResolvedValue([deployment] as never);
		vi.mocked(db.buyerDeployment.findFirst).mockResolvedValue(deployment as never);
	});

	it("returns 401 and does not touch tickets when the token query param is missing", async () => {
		await expect(
			call(
				chatwootWebhook,
				{ event: "message_created", content: "hi" },
				{
					context: {
						headers: new Headers(),
						url: "https://startkiter.dev/api/support/webhook/chatwoot",
						rawBody: "{}",
					},
				},
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });

		expect(db.supportTicket.create).not.toHaveBeenCalled();
		expect(db.supportTicket.update).not.toHaveBeenCalled();
	});

	it("returns 401 and does not touch tickets when the token query param does not match", async () => {
		const payload = { event: "message_created", content: "hi" };
		await expect(
			call(chatwootWebhook, payload, {
				context: {
					headers: new Headers(),
					url: webhookUrl("wrong-secret"),
					rawBody: JSON.stringify(payload),
				},
			}),
		).rejects.toBeInstanceOf(ORPCError);

		expect(db.supportTicket.findUnique).not.toHaveBeenCalled();
	});

	it("processes a valid conversation_created webhook and links the buyer deployment", async () => {
		const payload = {
			event: "conversation_created",
			id: 42,
			meta: { sender: { email: "buyer@example.com" } },
			custom_attributes: { buyerDeploymentId: "dep_1" },
			inbox: { channel_type: "Channel::WebWidget" },
		};
		const signed = signedCall(payload);

		await expect(
			call(chatwootWebhook, payload, {
				context: { headers: new Headers(), url: signed.url, rawBody: signed.rawBody },
			}),
		).resolves.toEqual({ ok: true, ticketId: "tkt_1" });

		expect(db.supportTicket.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: "user-1",
					buyerDeploymentId: "dep_1",
					chatwootConversationId: 42,
					channel: "WEB_WIDGET",
				}),
			}),
		);
	});

	it("updates the existing ticket for a duplicate conversation instead of inserting", async () => {
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(ticket);
		const payload = {
			event: "message_created",
			content: "還是打不開",
			message_type: 0,
			conversation: { id: 42, meta: { sender: { email: "buyer@example.com" } } },
		};
		const signed = signedCall(payload);
		const chatwoot = {
			postPublicReply: vi.fn(),
			postInternalNote: vi.fn(),
			markForHuman: vi.fn(),
		};

		await processChatwootWebhook({
			url: signed.url,
			rawBody: signed.rawBody,
			payload,
			deps: {
				chatwoot,
				generateDiagnosis: vi.fn().mockResolvedValue({
					confidence: "low",
					buyerReply: null,
					remediationSuggestion: "重啟機器",
					appearsResolved: false,
				}),
				fetchCoolifyAppStatus: vi.fn().mockResolvedValue({
					kind: "ok",
					reachable: true,
					publicUrl: "https://buyer.example",
				}),
				fetchCoolifyAppLogs: vi.fn().mockResolvedValue({ kind: "ok", logs: "Ready" }),
			},
		});

		expect(db.supportTicket.create).not.toHaveBeenCalled();
		expect(chatwoot.postPublicReply).not.toHaveBeenCalled();
		expect(chatwoot.postInternalNote.mock.calls.some((callArgs) => String(callArgs[1]).includes("重啟機器"))).toBe(
			true,
		);
		expect(chatwoot.markForHuman).toHaveBeenCalled();
	});

	it("keeps ticket status OPEN and marks human follow-up when the model fails", async () => {
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(ticket);
		const payload = {
			event: "message_created",
			content: "網站打不開",
			message_type: 0,
			conversation: { id: 42 },
		};
		const signed = signedCall(payload);
		const chatwoot = {
			postPublicReply: vi.fn(),
			postInternalNote: vi.fn(),
			markForHuman: vi.fn(),
		};

		await processChatwootWebhook({
			url: signed.url,
			rawBody: signed.rawBody,
			payload,
			deps: {
				chatwoot,
				generateDiagnosis: vi.fn().mockRejectedValue(new Error("model timeout")),
				fetchCoolifyAppStatus: vi.fn().mockResolvedValue({
					kind: "ok",
					reachable: true,
					publicUrl: "https://buyer.example",
				}),
				fetchCoolifyAppLogs: vi.fn().mockResolvedValue({ kind: "ok", logs: "Ready" }),
			},
		});

		expect(db.supportTicket.update).not.toHaveBeenCalled();
		expect(chatwoot.postPublicReply).not.toHaveBeenCalled();
		expect(chatwoot.markForHuman).toHaveBeenCalled();
	});

	it("posts a temporarily-unavailable internal note when Coolify fails", async () => {
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(ticket);
		const payload = {
			event: "message_created",
			content: "網站打不開",
			message_type: 0,
			conversation: { id: 42 },
		};
		const signed = signedCall(payload);
		const chatwoot = {
			postPublicReply: vi.fn(),
			postInternalNote: vi.fn(),
			markForHuman: vi.fn(),
		};

		await processChatwootWebhook({
			url: signed.url,
			rawBody: signed.rawBody,
			payload,
			deps: {
				chatwoot,
				generateDiagnosis: vi.fn().mockResolvedValue({
					confidence: "low",
					buyerReply: null,
					remediationSuggestion: null,
					appearsResolved: false,
				}),
				fetchCoolifyAppStatus: vi.fn().mockResolvedValue({ kind: "network_error" }),
				fetchCoolifyAppLogs: vi.fn().mockResolvedValue({ kind: "network_error" }),
			},
		});

		expect(chatwoot.postInternalNote).toHaveBeenCalledWith(42, "部署狀態暫時無法取得");
		expect(JSON.stringify(chatwoot.postInternalNote.mock.calls)).not.toMatch(/healthy|broken/i);
	});

	it("does not call Coolify when the ticket has no deployment", async () => {
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue({
			...ticket,
			buyerDeploymentId: null,
		});
		const payload = {
			event: "message_created",
			content: "發票問題",
			message_type: 0,
			conversation: { id: 42 },
		};
		const signed = signedCall(payload);
		const fetchStatus = vi.fn();
		const chatwoot = {
			postPublicReply: vi.fn(),
			postInternalNote: vi.fn(),
			markForHuman: vi.fn(),
		};

		await processChatwootWebhook({
			url: signed.url,
			rawBody: signed.rawBody,
			payload,
			deps: {
				chatwoot,
				generateDiagnosis: vi.fn(),
				fetchCoolifyAppStatus: fetchStatus,
				fetchCoolifyAppLogs: vi.fn(),
			},
		});

		expect(fetchStatus).not.toHaveBeenCalled();
		expect(chatwoot.postInternalNote).toHaveBeenCalledWith(42, "無部署資料，人工直接處理");
	});

	it("sets AI_SUGGESTED_RESOLVED instead of RESOLVED when the issue looks fixed", async () => {
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(ticket);
		const payload = {
			event: "message_created",
			content: "好了謝謝",
			message_type: 0,
			conversation: { id: 42 },
		};
		const signed = signedCall(payload);

		await processChatwootWebhook({
			url: signed.url,
			rawBody: signed.rawBody,
			payload,
			deps: {
				chatwoot: {
					postPublicReply: vi.fn(),
					postInternalNote: vi.fn(),
					markForHuman: vi.fn(),
				},
				generateDiagnosis: vi.fn().mockResolvedValue({
					confidence: "high",
					buyerReply: null,
					remediationSuggestion: null,
					appearsResolved: true,
				}),
				fetchCoolifyAppStatus: vi.fn().mockResolvedValue({
					kind: "ok",
					reachable: true,
					publicUrl: "https://buyer.example",
				}),
				fetchCoolifyAppLogs: vi.fn().mockResolvedValue({ kind: "ok", logs: "Ready" }),
			},
		});

		expect(db.supportTicket.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ status: "AI_SUGGESTED_RESOLVED" }),
			}),
		);
	});
});
