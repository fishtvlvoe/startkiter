export { config, getLocaleFromPathname, isLocale, locales, type Locale } from "./config";
export { getMessagesForLocale, type TranslationScope } from "./lib/get-messages";
export { default as defaultMailTranslations } from "./translations/en/mail.json";
export type { MailMessages, MarketingMessages, SaasMessages, SharedMessages } from "./types";
