import { config, isLocale, type Locale } from "../config";

export type TranslationScope = "marketing" | "saas" | "mail";
type MessageCatalog = Record<string, unknown>;

function isRecord(value: unknown): value is MessageCatalog {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(base: MessageCatalog, override: MessageCatalog): MessageCatalog {
	const merged = { ...base };
	for (const [key, value] of Object.entries(override)) {
		const current = merged[key];
		merged[key] = isRecord(current) && isRecord(value) ? mergeMessages(current, value) : value;
	}
	return merged;
}

function isMissingCatalogError(error: unknown): boolean {
	return error instanceof Error && /(cannot find module|failed to load|does not exist|enoent|unknown variable dynamic import)/i.test(error.message);
}

async function importLocaleMessages(locale: string, scope: TranslationScope | "shared"): Promise<MessageCatalog> {
	try {
		return (await import(`../translations/${locale}/${scope}.json`)).default as MessageCatalog;
	} catch (error) {
		if (isMissingCatalogError(error)) return {};
		throw error;
	}
}

function resolveLocale(locale: string): Locale {
	const normalizedLocale = locale.toLowerCase();
	return isLocale(normalizedLocale) ? normalizedLocale : config.defaultLocale;
}

export async function getMessagesForLocale<T = MessageCatalog>(
	locale: string,
	scope: TranslationScope,
): Promise<T> {
	const resolvedLocale = resolveLocale(locale);
	const defaultScope = await importLocaleMessages(config.defaultLocale, scope);
	const defaultShared = await importLocaleMessages(config.defaultLocale, "shared");
	const defaultMessages =
		scope === "marketing"
			? mergeMessages(defaultShared, defaultScope)
			: mergeMessages(defaultScope, defaultShared);
	if (resolvedLocale === config.defaultLocale) return defaultMessages as T;
	const localeScope = await importLocaleMessages(resolvedLocale, scope);
	const localeShared = await importLocaleMessages(resolvedLocale, "shared");
	const localeMessages =
		scope === "marketing"
			? mergeMessages(localeShared, localeScope)
			: mergeMessages(localeScope, localeShared);
	return mergeMessages(defaultMessages, localeMessages) as T;
}
