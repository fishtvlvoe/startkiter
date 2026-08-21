import { chatwootWebhook } from "./procedures/chatwoot-webhook";
import { confirmResolved } from "./procedures/confirm-resolved";
import { createSupportTicket } from "./procedures/create-ticket";
import { getSupportChannels } from "./procedures/get-channels";
import { lineWebhook } from "./procedures/line-webhook";
import { telegramWebhook } from "./procedures/telegram-webhook";

export const supportRouter = {
	chatwootWebhook,
	createTicket: createSupportTicket,
	confirmResolved,
	lineWebhook,
	telegramWebhook,
	getSupportChannels,
};
