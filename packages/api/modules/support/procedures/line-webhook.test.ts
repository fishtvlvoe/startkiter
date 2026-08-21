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
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
		},
		account: {
			findFirst: vi.fn(),
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

import { db } from "@startkiter/database";
import { createLineWebhookSignature, LINE_SIGNATURE_HEADER } from "@startkiter/support";

import { lineWebhook, processLineWebhook } from "./line-webhook";

const SECRET = "line-channel-secret-test";

const mockTicket = {
	id: "tkt_line_1",
	userId: "user-line-1",
	buyerDeploymentId: "dep_line_1",
	chatwootConversationId: 101,
	channel: "LINE" as const,
	status: "OPEN" as const,
	aiSuggestedResolvedAt: null,
	resolvedAt: null,
	resolvedBy: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

function signedLineCall(payload: Record<string, unknown>, secret = SECRET) {
	const rawBody = JSON.stringify(payload);
	const signature = createLineWebhookSignature({
		rawBody,
		secret,
	});
	const headers = new Headers({
		[LINE_SIGNATURE_HEADER]: signature,
	});
	return { rawBody, headers, payload };
}

describe("POST /support/webhook/line", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.LINE_MESSAGING_CHANNEL_SECRET = SECRET;
		process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN = "line-access-token";
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(null);
		vi.mocked(db.supportTicket.findFirst).mockResolvedValue(null);
		vi.mocked(db.supportTicket.create).mockResolvedValue(mockTicket);
		vi.mocked(db.supportTicket.update).mockResolvedValue(mockTicket);
		vi.mocked(db.account.findFirst).mockResolvedValue({
			id: "acc_1",
			userId: "user-line-1",
			providerId: "line",
			accountId: "U1234567890",
		} as never);
		vi.mocked(db.user.findUnique).mockResolvedValue({
			id: "user-line-1",
			email: "buyer@example.com",
		} as never);
		vi.mocked(db.user.findFirst).mockResolvedValue({
			id: "user-line-1",
			email: "buyer@example.com",
		} as never);
		vi.mocked(db.buyerDeployment.findMany).mockResolvedValue([]);
	});

	describe("Task 4.3: Signature Verification", () => {
		it("returns 401 when signature header is missing and does not modify database", async () => {
			const payload = {
				events: [
					{
						type: "message",
						message: { type: "text", text: "嗨" },
						source: { type: "user", userId: "U1234567890" },
					},
				],
			};

			await expect(
				call(lineWebhook, payload, {
					context: {
						headers: new Headers(),
						rawBody: JSON.stringify(payload),
					},
				}),
			).rejects.toMatchObject({ code: "UNAUTHORIZED" });

			expect(db.supportTicket.create).not.toHaveBeenCalled();
			expect(db.supportTicket.update).not.toHaveBeenCalled();
		});

		it("returns 401 when signature is invalid and does not modify database", async () => {
			const payload = {
				events: [
					{
						type: "message",
						message: { type: "text", text: "嗨" },
						source: { type: "user", userId: "U1234567890" },
					},
				],
			};

			await expect(
				call(lineWebhook, payload, {
					context: {
						headers: new Headers({
							[LINE_SIGNATURE_HEADER]: "invalid-signature",
						}),
						rawBody: JSON.stringify(payload),
					},
				}),
			).rejects.toBeInstanceOf(ORPCError);

			expect(db.supportTicket.create).not.toHaveBeenCalled();
			expect(db.supportTicket.update).not.toHaveBeenCalled();
		});
	});

	describe("Task 4.1: Unconfigured Graceful Handling", () => {
		it("does not call LINE Messaging API when LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is unset", async () => {
			delete process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;

			const payload = {
				events: [
					{
						type: "message",
						message: { type: "text", text: "買家求助" },
						source: { type: "user", userId: "U1234567890" },
					},
				],
			};
			const signed = signedLineCall(payload);
			const lineApiClient = { replyMessage: vi.fn() };

			const res = await processLineWebhook({
				headers: signed.headers,
				rawBody: signed.rawBody,
				payload,
				deps: {
					lineApiClient,
					chatwoot: {
						createChannelConversation: vi.fn().mockResolvedValue({ conversationId: 101 }),
						postPublicReply: vi.fn(),
						postInternalNote: vi.fn(),
						markForHuman: vi.fn(),
					},
				},
			});

			expect(lineApiClient.replyMessage).not.toHaveBeenCalled();
			expect(res.ok).toBe(true);
		});
	});

	describe("Task 4.7: LINE Message Ingestion and Forwarding to Chatwoot", () => {
		it("accepts a valid signed LINE message, creates a SupportTicket with channel LINE, and forwards to Chatwoot", async () => {
			const payload = {
				events: [
					{
						type: "message",
						message: { type: "text", id: "msg_1", text: "請問部署問題" },
						source: { type: "user", userId: "U1234567890" },
						replyToken: "reply_token_1",
					},
				],
			};
			const signed = signedLineCall(payload);
			const chatwoot = {
				createChannelConversation: vi.fn().mockResolvedValue({ conversationId: 101 }),
				postPublicReply: vi.fn(),
				postInternalNote: vi.fn(),
				markForHuman: vi.fn(),
			};

			const result = await processLineWebhook({
				headers: signed.headers,
				rawBody: signed.rawBody,
				payload,
				deps: { chatwoot },
			});

			expect(result.ok).toBe(true);
			expect(chatwoot.createChannelConversation).toHaveBeenCalledWith(
				expect.objectContaining({
					channel: "LINE",
					message: "請問部署問題",
					sourceId: "U1234567890",
				}),
			);
			expect(db.supportTicket.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						userId: "user-line-1",
						chatwootConversationId: 101,
						channel: "LINE",
						status: "OPEN",
					}),
				}),
			);
		});
	});
});
