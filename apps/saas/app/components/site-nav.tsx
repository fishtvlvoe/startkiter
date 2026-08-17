import Link from "next/link";

import { getMessagesForLocale } from "@startkiter/i18n";
import type { Locale } from "@startkiter/i18n";
import { ColorModeToggle, Logo } from "@startkiter/ui";

import { getRequestLocale } from "../../lib/request-locale";
import { shouldShowOperatorSettingsLink } from "../../lib/operator";
import { LocaleSwitcher } from "./locale-switcher";

type SiteNavProps = {
	signedIn?: boolean;
	email?: string | null;
	hasPurchase?: boolean;
	locale?: Locale;
};

type NavMessages = {
	brand: string;
	navigation: {
		login: string;
		signup: string;
		course: string;
		purchase: string;
		purchaseStatus: string;
		assistant: string;
		account: string;
		settings: string;
	};
};

export async function SiteNav({
	signedIn = false,
	email,
	hasPurchase = false,
	locale,
}: SiteNavProps) {
	const resolvedLocale = locale ?? (await getRequestLocale());
	const messages = await getMessagesForLocale<NavMessages>(resolvedLocale, "saas");
	const showSettings = shouldShowOperatorSettingsLink(
		signedIn,
		email,
		process.env.ADMIN_EMAIL,
	);

	return (
		<nav className="nav" aria-label="主要導覽">
			<Link className="nav-brand" href="/">
				<Logo />
			</Link>
			<div className="nav-links">
				{signedIn ? (
					<>
						<Link href="/course">{messages.navigation.course}</Link>
						<Link href="/checkout">
							{hasPurchase ? messages.navigation.purchaseStatus : messages.navigation.purchase}
						</Link>
						<Link href="/agent">{messages.navigation.assistant}</Link>
						<Link href="/app">{messages.navigation.account}</Link>
						{showSettings ? <Link href="/admin/settings">{messages.navigation.settings}</Link> : null}
						{email ? <span className="nav-email">{email}</span> : null}
					</>
				) : (
					<>
						<Link href="/login">{messages.navigation.login}</Link>
						<Link href="/signup">{messages.navigation.signup}</Link>
					</>
				)}
				<LocaleSwitcher current={resolvedLocale} />
				<ColorModeToggle
					modes={["system", "light", "dark"]}
					labels={{ system: "系統", light: "淺色", dark: "深色" }}
				/>
			</div>
		</nav>
	);
}
