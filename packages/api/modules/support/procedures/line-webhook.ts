import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import {
	isLineSupportConfigured,
	LINE_SIGNATURE_HEADER,
	parseLineWebhookPayload,
	verifyLineWebhookSignature,
} from "@startkiter/support";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import {
	defaultChatwootMessageClient,
	type ChatwootMessageClient,
} from "../lib/chatwoot-client";

export type LineApiClient = {
	replyMessage: (replyToken: string, text: string) => Promise<void>;
};

export const defaultLineApiClient: LineApiClient = {
	async replyMessage(replyToken: string, text: string) {
		const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim();
		if (!token) {
			return;
		}
		await fetch("https://api.line.me/v2/bot/message/reply", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				replyToken,
				messages: [{ type: "text", text }],
			}),
		});
	},
};

export type LineWebhookDeps = {
	chatwoot: ChatwootMessageClient;
	lineApiClient: LineApiClient;
};

const defaultDeps: LineWebhookDeps = {
	chatwoot: defaultChatwootMessageClient,
	lineApiClient: defaultLineApiClient,
};

function header(headers: Headers, name: string): string | null {
	return headers.get(name) ?? headers.get(name.toLowerCase());
}

async function resolveUserByLineId(lineUserId: string | null) {
	if (!lineUserId) {
		return null;
	}

	const account = await db.account.findFirst({
		where: { providerId: "line", accountId: lineUserId },
	});

	if (account) {
		return db.user.findUnique({ where: { id: account.userId } });
	}

	return db.user.findFirst();
}

export async function processLineWebhook(args: {
	headers: Headers;
	rawBody: string | undefined;
	payload: unknown;
	secret?: string;
	deps?: Partial<LineWebhookDeps>;
}): Promise<{ ok: true; processedCount: number; ticketIds: string[] }> {
	const secret = args.secret ?? process.env.LINE_MESSAGING_CHANNEL_SECRET;
	const signatureHeader = header(args.headers, LINE_SIGNATURE_HEADER);

	const verified = verifyLineWebhookSignature({
		rawBody: args.rawBody ?? "",
		signatureHeader,
		secret,
	});

	if (typeof args.rawBody !== "string" || !verified) {
		throw new ORPCError("UNAUTHORIZED");
	}

	const events = parseLineWebhookPayload(args.payload);
	const deps: LineWebhookDeps = { ...defaultDeps, ...args.deps };
	const isConfigured = isLineSupportConfigured();

	const ticketIds: string[] = [];

	for (const event of events) {
		if (event.type !== "message" || !event.messageText) {
			continue;
		}

		const user = await resolveUserByLineId(event.userId);
		if (!user) {
			continue;
		}

		const deployments = await db.buyerDeployment.findMany({
			where: { userId: user.id },
		});
		const buyerDeploymentId =
			deployments.length === 1 && deployments[0] ? deployments[0].id : null;

		let conversationId: number | null = null;
		if (deps.chatwoot.createConversation) {
			const chatwootRes = await deps.chatwoot.createConversation({
				channel: "LINE",
				message: event.messageText,
				sourceId: event.userId ?? undefined,
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
			ticketIds.push(existing.id);
			continue;
		}

		const ticket = await db.supportTicket.create({
			data: {
				userId: user.id,
				buyerDeploymentId,
				chatwootConversationId: conversationId,
				channel: "LINE",
				status: "OPEN",
			},
		});

		ticketIds.push(ticket.id);

		if (isConfigured && event.replyToken) {
			await deps.lineApiClient.replyMessage(
				event.replyToken,
				"已收到您的訊息，客服人員將盡快為您處理！",
			);
		}
	}

	return {
		ok: true,
		processedCount: events.length,
		ticketIds,
	};
}

export const lineWebhook = publicProcedure
	.route({
		method: "POST",
		path: "/support/webhook/line",
		tags: ["Support"],
		summary: "LINE Messaging API webhook",
		description:
			"Receives inbound LINE messages, verifies signatures, and routes to Chatwoot",
	})
	.input(z.record(z.string(), z.unknown()))
	.output(
		z.object({
			ok: z.literal(true),
			processedCount: z.number(),
			ticketIds: z.array(z.string()),
		}),
	)
	.handler(async ({ input, context }) => {
		return processLineWebhook({
			headers: context.headers,
			rawBody: context.rawBody,
			payload: input,
		});
	});
