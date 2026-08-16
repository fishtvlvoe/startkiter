import { cookies } from "next/headers";

import { config, isLocale, type Locale } from "@startkiter/i18n";

export async function getRequestLocale(): Promise<Locale> {
	const value = (await cookies()).get(config.localeCookieName)?.value;

	return value && isLocale(value) ? value : config.defaultLocale;
}
