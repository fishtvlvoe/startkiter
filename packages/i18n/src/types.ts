export interface LocaleDefinition {
	label: string;
	currency: string;
}

export interface I18nConfig {
	locales: Record<string, LocaleDefinition>;
	defaultLocale: string;
	defaultCurrency: string;
	localeCookieName: string;
}

export type MessageCatalog = Record<string, unknown>;
