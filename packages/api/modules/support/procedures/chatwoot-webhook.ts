import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { fetchCoolifyAppLogs, fetchCoolifyAppStatus } from "@startkiter/platform";
import {
	applyTicketStatusTransition,
	defaultGenerateDiagnosis,
	parseChatwootWebhookPayload,
	runCopilot,
	verifyChatwootWebhookToken,
	type ChatwootContactHints,
	type CopilotDeployment,
	type GenerateDiagnosis,
} from "@startkiter/support";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";
import { defaultChatwootMessageClient, type ChatwootMessageClient } from "../lib/chatwoot-client";

export type ChatwootWebhookDeps = {
	chatwoot: ChatwootMessageClient;
	generateDiagnosis: GenerateDiagnosis;
	fetchCoolifyAppStatus: typeof fetchCoolifyAppStatus;
	fetchCoolifyAppLogs: typeof fetchCoolifyAppLogs;
};

const defaultDeps: ChatwootWebhookDeps = {
	chatwoot: defaultChatwootMessageClient,
	generateDiagnosis: defaultGenerateDiagnosis,
	fetchCoolifyAppStatus,
	fetchCoolifyAppLogs,
};

type TicketRow = {
	id: string;
	userId: string;
	buyerDeploymentId: string | null;
	chatwootConversationId: number;
	status: "OPEN" | "AI_SUGGESTED_RESOLVED" | "RESOLVED" | "ESCALATED";
	aiSuggestedResolvedAt: Date | null;
};

async function resolveDeployment(
	userId: string,
	hintedDeploymentId: string | null,
): Promise<CopilotDeployment | null> {
	if (hintedDeploymentId) {
		const hinted = await db.buyerDeployment.findFirst({
			where: { id: hintedDeploymentId, userId },
		});
		if (hinted) {
			return {
				id: hinted.id,
				tier: hinted.tier === "self_hosted" ? "self-hosted" : hinted.tier,
				coolifyAppId: hinted.coolifyAppId ?? undefined,
			};
		}
	}

	const deployments = await db.buyerDeployment.findMany({ where: { userId } });
	if (deployments.length === 1 && deployments[0]) {
		const only = deployments[0];
		return {
			id: only.id,
			tier: only.tier === "self_hosted" ? "self-hosted" : only.tier,
			coolifyAppId: only.coolifyAppId ?? undefined,
		};
	}

	return null;
}

async function upsertTicket(hints: ChatwootContactHints): Promise<TicketRow | null> {
	if (!hints.conversationId) {
		return null;
	}

	const existing = await db.supportTicket.findUnique({
		where: { chatwootConversationId: hints.conversationId },
	});

	if (existing) {
		if (hints.event === "message_created" && hints.messageType === "incoming" && existing.status === "AI_SUGGESTED_RESOLVED") {
			return db.supportTicket.update({
				where: { id: existing.id },
				data: { status: "OPEN", aiSuggestedResolvedAt: null },
			});
		}
		return existing;
	}

	if (!hints.email) {
		return null;
	}

	const user = await db.user.findUnique({ where: { email: hints.email } });
	if (!user) {
		return null;
	}

	const deployment = await resolveDeployment(user.id, hints.buyerDeploymentId);

	return db.supportTicket.create({
		data: {
			userId: user.id,
			buyerDeploymentId: deployment?.id ?? null,
			chatwootConversationId: hints.conversationId,
			channel: hints.channel,
			status: "OPEN",
		},
	});
}

export async function processChatwootWebhook(args: {
	url: string | undefined;
	rawBody: string | undefined;
	payload: unknown;
	secret?: string;
	deps?: Partial<ChatwootWebhookDeps>;
}): Promise<{ ok: true; ticketId: string | null }> {
	const secret = args.secret ?? process.env.CHATWOOT_WEBHOOK_SECRET;
	const verified = verifyChatwootWebhookToken({
		url: args.url,
		secret,
	});

	if (typeof args.rawBody !== "string" || !verified) {
		throw new ORPCError("UNAUTHORIZED");
	}

	const hints = parseChatwootWebhookPayload(args.payload);
	if (!hints || (hints.event !== "conversation_created" && hints.event !== "message_created")) {
		return { ok: true, ticketId: null };
	}

	const ticket = await upsertTicket(hints);
	if (!ticket) {
		return { ok: true, ticketId: null };
	}

	const skipCopilot =
		hints.event === "message_created" && (hints.messageType !== "incoming" || hints.isPrivate);

	if (skipCopilot) {
		return { ok: true, ticketId: ticket.id };
	}

	const deps: ChatwootWebhookDeps = { ...defaultDeps, ...args.deps };
	const deployment = ticket.buyerDeploymentId
		? await resolveDeployment(ticket.userId, ticket.buyerDeploymentId)
		: null;

	const previousStatus = ticket.status;
	const result = await runCopilot({
		ticket: {
			buyerDeploymentId: ticket.buyerDeploymentId,
			status: ticket.status,
		},
		buyerMessage: hints.messageContent,
		deployment,
		coolifyApiToken: process.env.COOLIFY_API_TOKEN,
		readers: {
			fetchCoolifyAppStatus: deps.fetchCoolifyAppStatus,
			fetchCoolifyAppLogs: deps.fetchCoolifyAppLogs,
		},
		generateDiagnosis: deps.generateDiagnosis,
	});

	for (const note of result.internalNotes) {
		await deps.chatwoot.postInternalNote(ticket.chatwootConversationId, note);
	}

	if (result.buyerReply) {
		await deps.chatwoot.postPublicReply(ticket.chatwootConversationId, result.buyerReply);
	}

	if (result.escalateToHuman) {
		await deps.chatwoot.markForHuman(ticket.chatwootConversationId);
	}

	if (result.suggestResolved) {
		const next = applyTicketStatusTransition({
			from: previousStatus,
			to: "AI_SUGGESTED_RESOLVED",
			actor: "AI",
		});
		await db.supportTicket.update({
			where: { id: ticket.id },
			data: { status: next, aiSuggestedResolvedAt: new Date() },
		});
	}

	return { ok: true, ticketId: ticket.id };
}

export const chatwootWebhook = publicProcedure
	.route({
		method: "POST",
		path: "/support/webhook/chatwoot",
		tags: ["Support"],
		summary: "Chatwoot webhook",
		description: "Receives Chatwoot conversation and message events",
	})
	.input(z.record(z.string(), z.unknown()))
	.output(
		z.object({
			ok: z.literal(true),
			ticketId: z.string().nullable(),
		}),
	)
	.handler(async ({ input, context }) => {
		return processChatwootWebhook({
			url: context.url,
			rawBody: context.rawBody,
			payload: input,
		});
	});
