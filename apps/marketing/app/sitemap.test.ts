import { describe, expect, it } from "vitest";

import {
	SITEMAP_REVALIDATE_SECONDS,
	mergeSitemapUrls,
	type DatabasePageSitemapEntry,
	type FileSitemapEntry,
} from "./sitemap-entries";

describe("marketing sitemap merge (Requirement: Published content is included in the site's sitemap)", () => {
	const fileEntries: FileSitemapEntry[] = [
		{ url: "https://example.com/blog/first-post", lastModified: new Date("2026-01-01") },
	];

	it("uses a revalidate cache window rather than a fully static build", () => {
		expect(SITEMAP_REVALIDATE_SECONDS).toBe(300);
	});

	it("includes PUBLISHED database pages in the sitemap output", () => {
		const dbPages: DatabasePageSitemapEntry[] = [
			{ slug: "about", locale: "zh-tw", status: "PUBLISHED", type: "PAGE", updatedAt: new Date("2026-08-29") },
			{ slug: "hello", locale: "zh-tw", status: "PUBLISHED", type: "POST", updatedAt: new Date("2026-08-29") },
		];

		const urls = mergeSitemapUrls({
			baseUrl: "https://example.com",
			defaultLocale: "zh-tw",
			locales: ["zh-tw", "en"],
			fileEntries,
			dbPages,
		}).map((entry) => entry.url);

		expect(urls).toContain("https://example.com/about");
		expect(urls).toContain("https://example.com/blog/hello");
		expect(urls).toContain("https://example.com/en/about");
		expect(urls).toContain("https://example.com/en/blog/hello");
		expect(urls).toContain("https://example.com/blog/first-post");
	});

	it("excludes DRAFT and ARCHIVED database pages from the sitemap", () => {
		const dbPages: DatabasePageSitemapEntry[] = [
			{ slug: "draft-page", locale: "zh-tw", status: "DRAFT", type: "PAGE", updatedAt: new Date("2026-08-29") },
			{ slug: "old-page", locale: "zh-tw", status: "ARCHIVED", type: "PAGE", updatedAt: new Date("2026-08-29") },
			{ slug: "live-page", locale: "zh-tw", status: "PUBLISHED", type: "PAGE", updatedAt: new Date("2026-08-29") },
		];

		const urls = mergeSitemapUrls({
			baseUrl: "https://example.com",
			defaultLocale: "zh-tw",
			locales: ["zh-tw"],
			fileEntries,
			dbPages,
		}).map((entry) => entry.url);

		expect(urls).toContain("https://example.com/live-page");
		expect(urls).not.toContain("https://example.com/draft-page");
		expect(urls).not.toContain("https://example.com/old-page");
	});
});
