import { chatwootWebhook } from "./procedures/chatwoot-webhook";
import { confirmResolved } from "./procedures/confirm-resolved";
import { createSupportTicket } from "./procedures/create-ticket";

export const supportRouter = {
	chatwootWebhook,
	createTicket: createSupportTicket,
	confirmResolved,
};
