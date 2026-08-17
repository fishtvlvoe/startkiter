import type { MailMessages } from "@startkiter/i18n";

declare global {
	interface IntlMessages extends MailMessages {}
}
