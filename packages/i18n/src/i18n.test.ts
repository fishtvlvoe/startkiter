import { describe, expect, it } from "vitest";

import { getLocaleFromPathname, getMessagesForLocale, locales } from "./index";

async function getLocaleRoute(pathname: string): Promise<Response> {
	const locale = getLocaleFromPathname(pathname);

	if (!locale) {
		return new Response(null, { status: 404 });
	}

	await getMessagesForLocale(locale, "marketing");
	return new Response(null, { status: 200 });
}

describe("locale route contract", () => {
	it.each(["/zh-tw", "/zh-cn", "/en"])("GET %s returns 200", async (pathname) => {
		const response = await getLocaleRoute(pathname);

		expect(response.status).toBe(200);
	});

	it("declares the three launch locales", () => {
		expect(locales).toEqual(["zh-tw", "zh-cn", "en"]);
	});
});

describe("locale fallback", () => {
	it("falls back to zh-TW when an English key is missing", async () => {
		const messages = await getMessagesForLocale<{
			home: { hero: { title: string } };
		}>("en", "marketing");

		expect(messages.home.hero.title).toBe("已經在用 AI 做事的人，需要的是一套 SaaS 開站包");
		expect(messages.home.hero.title).not.toBe("home.hero.title");
	});
});

describe("launch message catalogs", () => {
	it.each([
		["zh-tw", "一次買斷，帶走課與終身代碼包"],
		["zh-cn", "一次买断，带走课程与终身代码包"],
		["en", "Buy once. Take the course and lifetime code package with you."],
	] as const)("loads the %s homepage catalog", async (locale, expectedTitle) => {
		const messages = await getMessagesForLocale<{
			home: { title: string };
		}>(locale, "marketing");

		expect(messages.home.title).toBe(expectedTitle);
	});
});
