import { timingSafeEqual } from "node:crypto";

export const TELEGRAM_SECRET_TOKEN_HEADER = "x-telegram-bot-api-secret-token";

export type TelegramWebhookMessage = {
	messageId: number | null;
	chatId: number | null;
	userId: string | null;
	username: string | null;
	firstName: string | null;
	messageText: string | null;
};

export function verifyTelegramWebhookSecret(args: {
	secretTokenHeader: string | null | undefined;
	secretToken: string | null | undefined;
}): boolean {
	const secret = args.secretToken?.trim() ?? "";
	const header = args.secretTokenHeader?.trim() ?? "";

	if (!secret || !header) {
		return false;
	}

	try {
		const headerBuffer = Buffer.from(header, "utf8");
		const secretBuffer = Buffer.from(secret, "utf8");

		if (
			headerBuffer.length === 0 ||
			headerBuffer.length !== secretBuffer.length
		) {
			return false;
		}

		return timingSafeEqual(headerBuffer, secretBuffer);
	} catch {
		return false;
	}
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

export function parseTelegramWebhookPayload(
	payload: unknown,
): TelegramWebhookMessage | null {
	const record = asRecord(payload);
	if (!record) {
		return null;
	}

	const message =
		asRecord(record.message) ??
		asRecord(record.edited_message) ??
		asRecord(record.channel_post);
	if (!message) {
		return null;
	}

	const from = asRecord(message.from);
	const chat = asRecord(message.chat);

	const messageId =
		typeof message.message_id === "number" ? message.message_id : null;
	const chatId =
		typeof chat?.id === "number"
			? chat.id
			: typeof chat?.id === "string"
				? Number.parseInt(chat.id, 10) || null
				: null;

	const rawUserId = from?.id ?? chat?.id;
	const userId =
		typeof rawUserId === "number" || typeof rawUserId === "string"
			? String(rawUserId).trim()
			: null;

	const username =
		typeof from?.username === "string" ? from.username.trim() : null;
	const firstName =
		typeof from?.first_name === "string" ? from.first_name.trim() : null;
	const messageText =
		typeof message.text === "string" ? message.text : null;

	return {
		messageId,
		chatId,
		userId,
		username,
		firstName,
		messageText,
	};
}
