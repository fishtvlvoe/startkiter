import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		className,
	}: {
		href: string;
		children: React.ReactNode;
		className?: string;
	}) => createElement("a", { href, className }, children),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@startkiter/ui", () => ({
	ColorModeToggle: () => createElement("div", { "data-slot": "color-mode-toggle" }),
}));

import { getMessagesForLocale, locales } from "@startkiter/i18n";

import { SiteNav } from "../app/components/site-nav";

type NavMessages = {
	brand: string;
	navigation: {
		login: string;
		signup: string;
		account: string;
	};
};

describe("SiteNav locales", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each(locales)("renders without throwing for locale %s", async (locale) => {
		const messages = await getMessagesForLocale<NavMessages>(locale, "saas");
		const html = renderToStaticMarkup(await SiteNav({ locale }));

		expect(html).toContain(messages.brand);
		expect(html).toContain(messages.navigation.login);
		expect(html).toContain(messages.navigation.signup);
		expect(html).not.toContain("home.hero.title");
	});
});
