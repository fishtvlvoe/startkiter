import type { SaasMessages } from "@startkiter/i18n";
import { getMessagesForLocale as getMessages } from "@startkiter/i18n";

export const getMessagesForLocale = async (locale: string): Promise<SaasMessages> => {
	return getMessages(locale as Parameters<typeof getMessages>[0], "saas");
};
