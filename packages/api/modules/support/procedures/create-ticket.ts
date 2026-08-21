import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { defaultChatwootMessageClient } from "../lib/chatwoot-client";

const input = z.object({
	message: z.string(),
	buyerDeploymentId: z.string().min(1).optional(),
	channel: z.enum(["WEB_WIDGET", "LINE", "TELEGRAM"]).default("WEB_WIDGET"),
});

export const createSupportTicket = protectedProcedure
	.route({ method: "POST", path: "/support/tickets", tags: ["Support"], summary: "Create support ticket" })
	.input(input)
	.output(z.object({ id: z.string(), chatwootConversationId: z.number(), status: z.literal("OPEN") }))
	.handler(async ({ input, context: { user } }) => {
		const message = input.message.trim();
		if (!message) throw new ORPCError("BAD_REQUEST", { message: "message 不可為空白" });

		let buyerDeploymentId = input.buyerDeploymentId;
		if (buyerDeploymentId) {
			const deployment = await db.buyerDeployment.findFirst({ where: { id: buyerDeploymentId, userId: user.id } });
			if (!deployment) throw new ORPCError("FORBIDDEN");
		} else {
			const deployments = await db.buyerDeployment.findMany({ where: { userId: user.id } });
			if (deployments.length === 1) buyerDeploymentId = deployments[0]?.id;
		}

		const createConversation = defaultChatwootMessageClient.createConversation;
		if (!createConversation) throw new ORPCError("INTERNAL_SERVER_ERROR");
		const conversation = await createConversation({
			content: message,
			contactIdentifier: user.email,
			customAttributes: buyerDeploymentId ? { buyerDeploymentId } : undefined,
		});
		const ticket = await db.supportTicket.create({
			data: {
				userId: user.id,
				buyerDeploymentId: buyerDeploymentId ?? null,
				chatwootConversationId: conversation.id,
				channel: input.channel,
			},
		});
		return { id: ticket.id, chatwootConversationId: ticket.chatwootConversationId, status: "OPEN" as const };
	});
