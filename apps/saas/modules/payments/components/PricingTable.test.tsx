// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { getMessagesForLocale } from "@startkiter/i18n";

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@shared/hooks/locale-currency", () => ({
	useLocaleCurrency: () => "TWD",
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children?: React.ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { PricingTable } from "./PricingTable";

describe("PricingTable purchase entry", () => {
	it("routes signed-in users to /checkout instead of calling createCheckoutLink", async () => {
		const messages = await getMessagesForLocale("zh-tw", "saas");

		const html = renderToStaticMarkup(
			<NextIntlClientProvider locale="zh-tw" messages={messages}>
				<PricingTable userId="user-1" />
			</NextIntlClientProvider>,
		);

		expect(html).toContain('href="/checkout"');
		expect(html).toContain('data-test="price-table-plan"');
		expect(html).not.toContain("createCheckoutLink");
	});
});
