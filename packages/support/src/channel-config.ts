import type { SupportTicketChannel } from "./chatwoot-payload";

export function isLineSupportConfigured(env?: {
	LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?: string;
}): boolean {
	const token =
		env?.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN ??
		process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
	return Boolean(token && token.trim().length > 0);
}

export function isTelegramSupportConfigured(env?: {
	TELEGRAM_BOT_TOKEN?: string;
}): boolean {
	const token =
		env?.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
	return Boolean(token && token.trim().length > 0);
}

export function getAvailableSupportChannels(env?: {
	LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?: string;
	TELEGRAM_BOT_TOKEN?: string;
}): SupportTicketChannel[] {
	const channels: SupportTicketChannel[] = ["WEB_WIDGET"];

	if (isLineSupportConfigured(env)) {
		channels.push("LINE");
	}

	if (isTelegramSupportConfigured(env)) {
		channels.push("TELEGRAM");
	}

	return channels;
}
