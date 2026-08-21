import { chatwootWebhook } from "./procedures/chatwoot-webhook";
import { getSupportChannels } from "./procedures/get-channels";
import { lineWebhook } from "./procedures/line-webhook";
import { telegramWebhook } from "./procedures/telegram-webhook";

export const supportRouter = {
	chatwootWebhook,
	lineWebhook,
	telegramWebhook,
	getSupportChannels,
};
