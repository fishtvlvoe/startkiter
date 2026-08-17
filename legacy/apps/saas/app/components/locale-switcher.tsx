"use client";

import { config, locales, type Locale } from "@startkiter/i18n";
import { useRouter } from "next/navigation";

export function LocaleSwitcher({ current }: { current: Locale }) {
	const router = useRouter();

	function selectLocale(locale: Locale) {
		document.cookie = `${config.localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
		router.refresh();
	}

	return (
		<div className="locale-switcher" role="group" aria-label="Language">
			{locales.map((locale) => (
				<button
					key={locale}
					type="button"
					data-test={`locale-toggle-${locale}`}
					aria-pressed={current === locale}
					onClick={() => selectLocale(locale)}
				>
					{config.locales[locale].label}
				</button>
			))}
		</div>
	);
}
