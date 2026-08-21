import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { applyTicketStatusTransition } from "@startkiter/support";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const confirmResolved = protectedProcedure
	.route({ method: "POST", path: "/support/tickets/:id/confirm-resolved", tags: ["Support"], summary: "Confirm ticket resolved" })
	.input(z.object({ id: z.string().min(1) }))
	.output(z.object({ id: z.string(), status: z.literal("RESOLVED") }))
	.handler(async ({ input, context: { user } }) => {
		const ticket = await db.supportTicket.findFirst({ where: { id: input.id, userId: user.id } });
		if (!ticket) throw new ORPCError("NOT_FOUND");
		if (ticket.status !== "AI_SUGGESTED_RESOLVED") throw new ORPCError("CONFLICT");

		const status = applyTicketStatusTransition({ from: ticket.status, to: "RESOLVED", actor: "BUYER_CONFIRMED" });
		const updated = await db.supportTicket.update({
			where: { id: ticket.id },
			data: { status, resolvedAt: new Date(), resolvedBy: "BUYER_CONFIRMED" },
		});
		return { id: updated.id, status: "RESOLVED" as const };
	});
