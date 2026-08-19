export type SupportTicketStatus = "OPEN" | "AI_SUGGESTED_RESOLVED" | "RESOLVED" | "ESCALATED";

export type TicketStatusActor = "AI" | "WEBHOOK" | "BUYER_CONFIRMED" | "AUTO_TIMEOUT";

export class ForbiddenTicketStatusTransitionError extends Error {
	constructor(message = "AI does not have authority to fully resolve a ticket") {
		super(message);
		this.name = "ForbiddenTicketStatusTransitionError";
	}
}

export function applyTicketStatusTransition(args: {
	from: SupportTicketStatus;
	to: SupportTicketStatus;
	actor: TicketStatusActor;
}): SupportTicketStatus {
	if (args.to === "RESOLVED" && args.actor !== "BUYER_CONFIRMED" && args.actor !== "AUTO_TIMEOUT") {
		throw new ForbiddenTicketStatusTransitionError();
	}

	return args.to;
}
