import { describe, expect, it } from "vitest";

import { restorePage, snapshotPage, type PageRecord } from "./restore";

function makePage(overrides: Partial<PageRecord> = {}): PageRecord {
	return {
		id: "page_1",
		type: "POST",
		slug: "hello",
		locale: "zh-tw",
		title: "原文標題",
		excerpt: "摘要",
		body: "<p>原文</p>",
		coverImageUrl: null,
		seoTitle: "SEO 標題",
		seoDescription: "SEO 描述",
		tags: ["a"],
		status: "DRAFT",
		publishedAt: null,
		previousSnapshot: null,
		...overrides,
	};
}

describe("restore previousSnapshot (Requirement: Buyer can restore the previous version of a content record)", () => {
	it("restores editable fields from previousSnapshot and captures the replaced state", () => {
		const original = makePage();
		const snapshot = snapshotPage(original);
		const edited = makePage({
			title: "誤改標題",
			body: "<p>誤改</p>",
			previousSnapshot: snapshot,
		});

		const result = restorePage(edited);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.page.title).toBe("原文標題");
		expect(result.page.body).toBe("<p>原文</p>");
		expect(result.page.previousSnapshot).toEqual(snapshotPage(edited));
	});

	it("returns 409 and does not modify the record when no snapshot exists", () => {
		const page = makePage({ previousSnapshot: null });

		const result = restorePage(page);

		expect(result).toEqual({ ok: false, status: 409 });
	});
});
