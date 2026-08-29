import { describe, expect, it } from "vitest";

import { pickLocalizedPage } from "./database-pages";

describe("pickLocalizedPage (M-3 locale fallback)", () => {
	const pages = [
		{ slug: "about", locale: "en", title: "About EN" },
		{ slug: "about", locale: "zh-tw", title: "關於我們" },
	];

	it("returns the exact locale when it exists", () => {
		expect(pickLocalizedPage(pages, "en")?.title).toBe("About EN");
		expect(pickLocalizedPage(pages, "zh-tw")?.title).toBe("關於我們");
	});

	it("falls back to zh-tw when the requested locale is missing", () => {
		expect(pickLocalizedPage(pages, "zh-cn")?.title).toBe("關於我們");
	});

	it("does not use a non-deterministic matches[0] fallback for en-only content", () => {
		const enOnly = [{ slug: "about", locale: "en", title: "About EN" }];
		expect(pickLocalizedPage(enOnly, "en")?.title).toBe("About EN");
		expect(pickLocalizedPage(enOnly, "zh-tw")).toBeNull();
		expect(pickLocalizedPage(enOnly, "zh-cn")).toBeNull();
	});

	it("does not fall back to zh-cn-only content for other locales", () => {
		const zhCnOnly = [{ slug: "about", locale: "zh-cn", title: "关于" }];
		expect(pickLocalizedPage(zhCnOnly, "zh-cn")?.title).toBe("关于");
		expect(pickLocalizedPage(zhCnOnly, "zh-tw")).toBeNull();
		expect(pickLocalizedPage(zhCnOnly, "en")).toBeNull();
	});
});
