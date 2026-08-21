import { db } from "@startkiter/database";
import { applyTicketStatusTransition } from "@startkiter/support";

const RESOLUTION_WAIT_MS = 3 * 24 * 60 * 60 * 1000;

export async function processTimedOutSupportTickets(now = new Date()): Promise<number> {
	const cutoff = new Date(now.getTime() - RESOLUTION_WAIT_MS);
	const tickets = await db.supportTicket.findMany({
		where: { status: "AI_SUGGESTED_RESOLVED", aiSuggestedResolvedAt: { lte: cutoff } },
	});
	for (const ticket of tickets) {
		const status = applyTicketStatusTransition({ from: ticket.status, to: "RESOLVED", actor: "AUTO_TIMEOUT" });
		await db.supportTicket.update({
			where: { id: ticket.id },
			data: { status, resolvedAt: now, resolvedBy: "AUTO_TIMEOUT" },
		});
	}
	return tickets.length;
}
