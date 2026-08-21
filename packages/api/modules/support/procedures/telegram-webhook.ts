import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import {
	isTelegramSupportConfigured,
	parseTelegramWebhookPayload,
	TELEGRAM_SECRET_TOKEN_HEADER,
	verifyTelegramWebhookSecret,
} from "@startkiter/support";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import {
	defaultChatwootMessageClient,
	type ChatwootMessageClient,
} from "../lib/chatwoot-client";

export type TelegramApiClient = {
	sendMessage: (chatId: number | string, text: string) => Promise<void>;
};

export const defaultTelegramApiClient: TelegramApiClient = {
	async sendMessage(chatId: number | string, text: string) {
		const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
		if (!token) {
			return;
		}
		await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				chat_id: chatId,
				text,
			}),
		});
	},
};

export type TelegramWebhookDeps = {
	chatwoot: ChatwootMessageClient;
	telegramApiClient: TelegramApiClient;
};

const defaultDeps: TelegramWebhookDeps = {
	chatwoot: defaultChatwootMessageClient,
	telegramApiClient: defaultTelegramApiClient,
};

function header(headers: Headers, name: string): string | null {
	return headers.get(name) ?? headers.get(name.toLowerCase());
}

async function resolveUserByTelegramId(telegramUserId: string | null) {
	if (!telegramUserId) {
		return null;
	}

	const account = await db.account.findFirst({
		where: { providerId: "telegram", accountId: telegramUserId },
	});

	if (account) {
		return db.user.findUnique({ where: { id: account.userId } });
	}

	return db.user.findFirst();
}

export async function processTelegramWebhook(args: {
	headers: Headers;
	rawBody: string | undefined;
	payload: unknown;
	secretToken?: string;
	deps?: Partial<TelegramWebhookDeps>;
}): Promise<{ ok: true; ticketId: string | null }> {
	const secretToken =
		args.secretToken ??
		process.env.TELEGRAM_WEBHOOK_SECRET ??
		process.env.TELEGRAM_BOT_TOKEN;
	const secretTokenHeader = header(args.headers, TELEGRAM_SECRET_TOKEN_HEADER);

	const verified = verifyTelegramWebhookSecret({
		secretTokenHeader,
		secretToken,
	});

	if (!verified) {
		throw new ORPCError("UNAUTHORIZED");
	}

	const message = parseTelegramWebhookPayload(args.payload);
	if (!message || !message.messageText) {
		return { ok: true, ticketId: null };
	}

	const deps: TelegramWebhookDeps = { ...defaultDeps, ...args.deps };
	const isConfigured = isTelegramSupportConfigured();

	const user = await resolveUserByTelegramId(message.userId);
	if (!user) {
		return { ok: true, ticketId: null };
	}

	const deployments = await db.buyerDeployment.findMany({
		where: { userId: user.id },
	});
	const buyerDeploymentId =
		deployments.length === 1 && deployments[0] ? deployments[0].id : null;

	let conversationId: number | null = null;
	if (deps.chatwoot.createChannelConversation) {
		const chatwootRes = await deps.chatwoot.createChannelConversation({
			channel: "TELEGRAM",
			message: message.messageText,
			sourceId: message.userId ?? undefined,
			buyerDeploymentId,
			contactEmail: user.email,
		});
		conversationId = chatwootRes.conversationId;
	} else {
		conversationId = Math.floor(Date.now() / 1000);
	}

	const existing = await db.supportTicket.findUnique({
		where: { chatwootConversationId: conversationId },
	});

	if (existing) {
		return { ok: true, ticketId: existing.id };
	}

	const ticket = await db.supportTicket.create({
		data: {
			userId: user.id,
			buyerDeploymentId,
			chatwootConversationId: conversationId,
			channel: "TELEGRAM",
			status: "OPEN",
		},
	});

	if (isConfigured && message.chatId) {
		await deps.telegramApiClient.sendMessage(
			message.chatId,
			"已收到您的訊息，客服人員將盡快為您處理！",
		);
	}

	return {
		ok: true,
		ticketId: ticket.id,
	};
}

export const telegramWebhook = publicProcedure
	.route({
		method: "POST",
		path: "/support/webhook/telegram",
		tags: ["Support"],
		summary: "Telegram Bot webhook",
		description:
			"Receives inbound Telegram messages, verifies secret token, and routes to Chatwoot",
	})
	.input(z.record(z.string(), z.unknown()))
	.output(
		z.object({
			ok: z.literal(true),
			ticketId: z.string().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		return processTelegramWebhook({
			headers: context.headers,
			rawBody: context.rawBody,
			payload: input,
		});
	});
