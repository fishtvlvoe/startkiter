export type SupportTicketChannel = "WEB_WIDGET" | "LINE" | "TELEGRAM";

export type ChatwootContactHints = {
	conversationId: number | null;
	email: string | null;
	buyerDeploymentId: string | null;
	channel: SupportTicketChannel;
	messageContent: string;
	messageType: "incoming" | "outgoing" | "activity" | "unknown";
	isPrivate: boolean;
	event: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readCustomAttributes(payload: Record<string, unknown>): Record<string, unknown> {
	return (
		asRecord(payload.custom_attributes) ??
		asRecord(asRecord(payload.conversation)?.custom_attributes) ??
		{}
	);
}

function readChannel(payload: Record<string, unknown>): SupportTicketChannel {
	const inbox = asRecord(payload.inbox) ?? asRecord(asRecord(payload.conversation)?.inbox);
	const channelType = readString(inbox?.channel_type)?.toLowerCase() ?? "";
	if (channelType.includes("line")) {
		return "LINE";
	}
	if (channelType.includes("telegram")) {
		return "TELEGRAM";
	}
	return "WEB_WIDGET";
}

function readEmail(payload: Record<string, unknown>): string | null {
	const meta = asRecord(payload.meta) ?? asRecord(asRecord(payload.conversation)?.meta);
	const sender = asRecord(payload.sender) ?? asRecord(meta?.sender);
	const custom = readCustomAttributes(payload);
	return (
		readString(sender?.email) ??
		readString(custom.email) ??
		readString(custom.buyerEmail) ??
		readString(custom.buyer_email)
	);
}

function readConversationId(payload: Record<string, unknown>, event: string): number | null {
	const nested = asRecord(payload.conversation);
	if (event === "conversation_created") {
		return readNumber(payload.id) ?? readNumber(nested?.id);
	}
	return readNumber(nested?.id) ?? readNumber(payload.conversation_id) ?? readNumber(payload.id);
}

function readMessageType(payload: Record<string, unknown>): ChatwootContactHints["messageType"] {
	const raw = payload.message_type;
	if (raw === 0 || raw === "incoming") {
		return "incoming";
	}
	if (raw === 1 || raw === "outgoing") {
		return "outgoing";
	}
	if (raw === 2 || raw === "activity") {
		return "activity";
	}
	return "unknown";
}

export function parseChatwootWebhookPayload(payload: unknown): ChatwootContactHints | null {
	const record = asRecord(payload);
	if (!record) {
		return null;
	}
	const event = readString(record.event);
	if (!event) {
		return null;
	}

	const custom = readCustomAttributes(record);

	return {
		event,
		conversationId: readConversationId(record, event),
		email: readEmail(record),
		buyerDeploymentId: readString(custom.buyerDeploymentId) ?? readString(custom.buyer_deployment_id),
		channel: readChannel(record),
		messageContent: readString(record.content) ?? "",
		messageType: event === "message_created" ? readMessageType(record) : "unknown",
		isPrivate: record.private === true,
	};
}
