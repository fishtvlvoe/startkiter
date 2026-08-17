import { describe, expect, it } from "vitest";

import { getLocaleFromPathname, getMessagesForLocale, locales } from "./index";

describe("locale route contract", () => {
	it.each(["/zh-tw", "/zh-cn", "/en"])("recognizes %s", (pathname) => {
		expect(getLocaleFromPathname(pathname)).not.toBeNull();
	});

	it("declares the three launch locales", () => {
		expect(locales).toEqual(["zh-tw", "zh-cn", "en"]);
	});
});

describe("locale fallback", () => {
	it("falls back to zh-TW when an English key is missing", async () => {
		const messages = await getMessagesForLocale<{
			home: { legacyFallback: string };
		}>("en", "marketing");

		expect(messages.home.legacyFallback).toBe("這個字串只存在繁體中文目錄，用來驗證缺 key fallback。");
		expect(messages.home.legacyFallback).not.toBe("home.legacyFallback");
	});
});

describe("launch message catalogs", () => {
	it.each([
		["zh-tw", "一次買斷，帶走課與終身代碼包"],
		["zh-cn", "一次买断，带走课程与终身代码包"],
		["en", "Buy once. Take the course and lifetime code package with you."],
	] as const)("loads the %s homepage catalog", async (locale, expectedTitle) => {
		const messages = await getMessagesForLocale<{ home: { title: string } }>(locale, "marketing");
		expect(messages.home.title).toBe(expectedTitle);
	});
});
