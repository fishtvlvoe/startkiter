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

describe("translated app surfaces", () => {
	it.each([
		[
			"zh-tw",
			{
				loginTitle: "歡迎回來",
				accountSettings: "帳號設定",
				courseLabel: "課程",
				courseLocked: "購買開站包後即可解鎖全部單元。",
				marketingPricing: "價格",
				marketingPricingDescription: "課程與終身 GitHub 代碼包一起取得，後續可按需要擴充模組。",
			},
		],
		[
			"zh-cn",
			{
				loginTitle: "欢迎回来",
				accountSettings: "账户设置",
				courseLabel: "课程",
				courseLocked: "购买开站包后即可解锁全部单元。",
				marketingPricing: "价格",
				marketingPricingDescription: "课程与终身 GitHub 代码包一起取得，之后可按需要扩展模块。",
			},
		],
	] as const)("provides translated strings for %s", async (locale, expected) => {
		const saas = await getMessagesForLocale<{
			auth: { login: { title: string } };
			app: { menu: { accountSettings: string } };
			course: { navLabel: string; lockedDescription: string };
		}>(locale, "saas");
		const marketing = await getMessagesForLocale<{
			pricing: { title: string; description: string };
		}>(locale, "marketing");

		expect(saas.auth.login.title).toBe(expected.loginTitle);
		expect(saas.app.menu.accountSettings).toBe(expected.accountSettings);
		expect(saas.course.navLabel).toBe(expected.courseLabel);
		expect(saas.course.lockedDescription).toBe(expected.courseLocked);
		expect(marketing.pricing.title).toBe(expected.marketingPricing);
		expect(marketing.pricing.description).toBe(expected.marketingPricingDescription);
	});
});
