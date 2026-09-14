// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { getMessagesForLocale } from "@startkiter/i18n";

import { usePlanData } from "./plan-data";

function PlanDataProbe() {
	const { planData } = usePlanData();
	const entry = planData["startkiter-mvp"];
	const features = (entry?.features ?? []).map(String);

	return (
		<div
			data-testid="plan-data"
			data-title={String(entry?.title ?? "")}
			data-features={features.join("|")}
			data-feature-count={String(features.length)}
			data-free-title={String(planData.free?.title ?? "")}
		/>
	);
}

describe("usePlanData billing translations", () => {
	it.each(["zh-tw", "zh-cn", "en"] as const)(
		"%s startkiter-mvp title is translated and features are not character-split",
		async (locale) => {
			const messages = await getMessagesForLocale(locale, "saas");

			const html = renderToStaticMarkup(
				<NextIntlClientProvider locale={locale} messages={messages}>
					<PlanDataProbe />
				</NextIntlClientProvider>,
			);

			const title = html.match(/data-title="([^"]*)"/)?.[1] ?? "";
			const features = (html.match(/data-features="([^"]*)"/)?.[1] ?? "")
				.split("|")
				.filter(Boolean);
			const freeTitle = html.match(/data-free-title="([^"]*)"/)?.[1] ?? "";

			expect(title).not.toBe("pricing.products.startkiter-mvp.title");
			expect(title.trim().length).toBeGreaterThan(0);
			expect(features.length).toBeGreaterThan(0);
			expect(features.every((feature) => feature.length > 1)).toBe(true);
			expect(freeTitle).not.toBe("pricing.products.free.title");
		},
	);
});
