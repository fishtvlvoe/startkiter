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
import { TELEGRAM_SECRET_TOKEN_HEADER } from "@startkiter/support";

import { processTelegramWebhook, telegramWebhook } from "./telegram-webhook";

const SECRET = "telegram-secret-token-test";

const mockTicket = {
	id: "tkt_tg_1",
	userId: "user-tg-1",
	buyerDeploymentId: "dep_tg_1",
	chatwootConversationId: 202,
	channel: "TELEGRAM" as const,
	status: "OPEN" as const,
	aiSuggestedResolvedAt: null,
	resolvedAt: null,
	resolvedBy: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("POST /support/webhook/telegram", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
		process.env.TELEGRAM_BOT_TOKEN = "tg-bot-token";
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(null);
		vi.mocked(db.supportTicket.findFirst).mockResolvedValue(null);
		vi.mocked(db.supportTicket.create).mockResolvedValue(mockTicket);
		vi.mocked(db.supportTicket.update).mockResolvedValue(mockTicket);
		vi.mocked(db.account.findFirst).mockResolvedValue({
			id: "acc_tg_1",
			userId: "user-tg-1",
			providerId: "telegram",
			accountId: "998877",
		} as never);
		vi.mocked(db.user.findUnique).mockResolvedValue({
			id: "user-tg-1",
			email: "tg-buyer@example.com",
		} as never);
		vi.mocked(db.user.findFirst).mockResolvedValue({
			id: "user-tg-1",
			email: "tg-buyer@example.com",
		} as never);
		vi.mocked(db.buyerDeployment.findMany).mockResolvedValue([]);
	});

	describe("Task 4.4: Secret Token Verification", () => {
		it("returns 401 when secret header is missing and does not modify database", async () => {
			const payload = {
				update_id: 1,
				message: {
					message_id: 10,
					from: { id: 998877, first_name: "Buyer" },
					chat: { id: 998877 },
					text: "你好",
				},
			};

			await expect(
				call(telegramWebhook, payload, {
					context: {
						headers: new Headers(),
						rawBody: JSON.stringify(payload),
					},
				}),
			).rejects.toMatchObject({ code: "UNAUTHORIZED" });

			expect(db.supportTicket.create).not.toHaveBeenCalled();
			expect(db.supportTicket.update).not.toHaveBeenCalled();
		});

		it("returns 401 when secret token does not match and does not modify database", async () => {
			const payload = {
				update_id: 1,
				message: {
					message_id: 10,
					from: { id: 998877, first_name: "Buyer" },
					chat: { id: 998877 },
					text: "你好",
				},
			};

			await expect(
				call(telegramWebhook, payload, {
					context: {
						headers: new Headers({
							[TELEGRAM_SECRET_TOKEN_HEADER]: "wrong-secret-token",
						}),
						rawBody: JSON.stringify(payload),
					},
				}),
			).rejects.toBeInstanceOf(ORPCError);

			expect(db.supportTicket.create).not.toHaveBeenCalled();
			expect(db.supportTicket.update).not.toHaveBeenCalled();
		});
	});

	describe("Task 4.2: Unconfigured Graceful Handling", () => {
		it("does not call Telegram Bot API when TELEGRAM_BOT_TOKEN is unset", async () => {
			delete process.env.TELEGRAM_BOT_TOKEN;

			const payload = {
				update_id: 1,
				message: {
					message_id: 10,
					from: { id: 998877, first_name: "Buyer" },
					chat: { id: 998877 },
					text: "求助",
				},
			};
			const headers = new Headers({
				[TELEGRAM_SECRET_TOKEN_HEADER]: SECRET,
			});
			const telegramApiClient = { sendMessage: vi.fn() };

			const res = await processTelegramWebhook({
				headers,
				rawBody: JSON.stringify(payload),
				payload,
				deps: {
					telegramApiClient,
					chatwoot: {
						createChannelConversation: vi.fn().mockResolvedValue({ conversationId: 202 }),
						postPublicReply: vi.fn(),
						postInternalNote: vi.fn(),
						markForHuman: vi.fn(),
					},
				},
			});

			expect(telegramApiClient.sendMessage).not.toHaveBeenCalled();
			expect(res.ok).toBe(true);
		});
	});

	describe("Task 4.8: Telegram Message Ingestion and Forwarding to Chatwoot", () => {
		it("accepts a valid authorized Telegram message, creates a SupportTicket with channel TELEGRAM, and forwards to Chatwoot", async () => {
			const payload = {
				update_id: 1,
				message: {
					message_id: 10,
					from: { id: 998877, first_name: "Buyer", username: "buyer_telegram" },
					chat: { id: 998877 },
					text: "網站掛掉了需要協助",
				},
			};
			const headers = new Headers({
				[TELEGRAM_SECRET_TOKEN_HEADER]: SECRET,
			});
			const chatwoot = {
				createChannelConversation: vi.fn().mockResolvedValue({ conversationId: 202 }),
				postPublicReply: vi.fn(),
				postInternalNote: vi.fn(),
				markForHuman: vi.fn(),
			};

			const result = await processTelegramWebhook({
				headers,
				rawBody: JSON.stringify(payload),
				payload,
				deps: { chatwoot },
			});

			expect(result.ok).toBe(true);
			expect(chatwoot.createChannelConversation).toHaveBeenCalledWith(
				expect.objectContaining({
					channel: "TELEGRAM",
					message: "網站掛掉了需要協助",
					sourceId: "998877",
				}),
			);
			expect(db.supportTicket.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						userId: "user-tg-1",
						chatwootConversationId: 202,
						channel: "TELEGRAM",
						status: "OPEN",
					}),
				}),
			);
		});
	});
});
