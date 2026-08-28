import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import de from "./translations/de/marketing.json";
import en from "./translations/en/marketing.json";
import es from "./translations/es/marketing.json";
import fr from "./translations/fr/marketing.json";
import zhCn from "./translations/zh-cn/marketing.json";
import zhTw from "./translations/zh-tw/marketing.json";

const catalogs = { "zh-tw": zhTw, "zh-cn": zhCn, en, de, fr, es } as const;
const requiredCommonPaths = [
	"footer.blog",
	"footer.features",
	"footer.pricing",
	"footer.privacyPolicy",
	"footer.termsAndConditions",
	"footer.builtWith",
	"menu.blog",
	"menu.changelog",
	"menu.contact",
	"menu.dashboard",
	"menu.docs",
	"menu.faq",
	"menu.login",
	"menu.pricing",
	"aria.menu",
	"aria.language",
	"tableOfContents.title",
	"colorMode.system",
	"colorMode.light",
	"colorMode.dark",
	"consent.description",
	"consent.decline",
	"consent.allow",
] as const;

function getCatalogPath(locale: string) {
	return resolve(import.meta.dirname, `translations/${locale}/marketing.json`);
}

describe("marketing pricing translations", () => {
	it.each(Object.keys(catalogs))("%s keeps one complete common object", (locale) => {
		const source = readFileSync(getCatalogPath(locale), "utf8");
		expect(source.match(/^  "common":/gm)).toHaveLength(1);

		const common = catalogs[locale as keyof typeof catalogs].common as Record<string, unknown>;
		for (const path of requiredCommonPaths) {
			const value = path.split(".").reduce<unknown>((current, key) => {
				return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
			}, common);
			expect(value, `${locale}.common.${path}`).toEqual(expect.any(String));
		}
	});

	for (const [locale, catalog] of Object.entries(catalogs)) {
		it(`${locale} has a complete non-empty one-time pricing message set`, () => {
			const pricing = catalog.pricing;
			expect(pricing).toBeTruthy();
			if (!pricing) {
				return;
			}

			for (const key of ["badge", "title", "description", "getStarted", "oneTime"] as const) {
				expect(pricing[key], `${locale}.${key}`).toEqual(expect.any(String));
				expect(pricing[key].trim(), `${locale}.${key}`).not.toBe("");
			}

			const product = pricing.products?.["startkiter-mvp"];
			expect(product, `${locale}.pricing.products.startkiter-mvp`).toBeTruthy();
			if (!product) {
				return;
			}

			expect(product.title.trim()).not.toBe("");
			expect(product.description.trim()).not.toBe("");
			expect(Object.values(product.features)).toEqual(
				expect.arrayContaining([expect.any(String)]),
			);
			expect(Object.values(product.features).every((feature) => feature.trim() !== "")).toBe(true);
		});
	}
});
