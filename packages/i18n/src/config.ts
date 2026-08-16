import type { I18nConfig, LocaleDefinition } from "./types";

export const locales = ["zh-tw", "zh-cn", "en"] as const;

export type Locale = (typeof locales)[number];

const localeMetadata: Record<string, LocaleDefinition> = {
	"zh-tw": {
		label: "繁體中文",
		currency: "TWD",
	},
	"zh-cn": {
		label: "简体中文",
		currency: "TWD",
	},
	en: {
		label: "English",
		currency: "TWD",
	},
};

const localeDefinitions = Object.fromEntries(
	locales.map((locale) => [
		locale,
		localeMetadata[locale] ?? {
			label: locale,
			currency: "TWD",
		},
	]),
) as Record<Locale, LocaleDefinition>;

export const config = {
	locales: localeDefinitions,
	defaultLocale: "zh-tw",
	defaultCurrency: "TWD",
	localeCookieName: "NEXT_LOCALE",
} as const satisfies I18nConfig;

export function isLocale(value: string): value is Locale {
	return (locales as readonly string[]).includes(value);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
	const segment = pathname.split("/").find(Boolean)?.toLowerCase();

	return segment && isLocale(segment) ? segment : null;
}
