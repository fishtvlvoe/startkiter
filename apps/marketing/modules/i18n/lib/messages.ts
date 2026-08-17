import type { MarketingMessages } from "@startkiter/i18n";
import { getMessagesForLocale as getMessages } from "@startkiter/i18n";

export const getMessagesForLocale = async (locale: string): Promise<MarketingMessages> => {
	return getMessages(locale as Parameters<typeof getMessages>[0], "marketing");
};
