import { config as i18nConfig } from "@i18n/config";
import { getBaseUrl } from "@shared/lib/base-url";
import { getUniqueBasePaths } from "@shared/lib/content";
import { allLegalPages, allPosts } from "content-collections";
import type { MetadataRoute } from "next";

import { mergeSitemapUrls, type DatabasePageSitemapEntry } from "./sitemap-entries";

// Next.js 靜態解析 sitemap.ts 的 revalidate 匯出，必須是字面量，不能引用外部常數
// （引用會讓 Turbopack 靜默建置失敗；webpack 會明確報錯 "Unknown identifier"）。
// SITEMAP_REVALIDATE_SECONDS 仍從 sitemap-entries.ts 匯出供測試核對這個數字。
export const revalidate = 300;

const baseUrl = getBaseUrl();
const locales = Object.keys(i18nConfig.locales);
const defaultLocale = i18nConfig.defaultLocale;

function localePath(locale: string, path: string): string {
	const prefix = locale === defaultLocale ? "" : `/${locale}`;
	return `${prefix}${path}`;
}

const staticMarketingPages = ["", "/blog", "/changelog"];

async function listPublishedDatabasePages(): Promise<DatabasePageSitemapEntry[]> {
	if (!process.env.DATABASE_URL) {
		return [];
	}

	try {
		const { db } = await import("@startkiter/database");
		const pages = await db.page.findMany({
			where: { status: "PUBLISHED" },
			select: {
				slug: true,
				locale: true,
				status: true,
				type: true,
				updatedAt: true,
			},
		});
		return pages.map((page) => ({
			slug: page.slug,
			locale: page.locale,
			status: page.status,
			type: page.type,
			updatedAt: page.updatedAt,
		}));
	} catch {
		return [];
	}
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const postPaths = getUniqueBasePaths(allPosts);
	const legalPaths = getUniqueBasePaths(allLegalPages);
	const dbPages = await listPublishedDatabasePages();

	const fileEntries = [
		...staticMarketingPages.flatMap((page) =>
			locales.map((locale) => ({
				url: new URL(localePath(locale, page), baseUrl).href,
				lastModified: new Date(),
			})),
		),
		...postPaths.flatMap((path) =>
			locales.map((locale) => ({
				url: new URL(localePath(locale, `/blog/${path}`), baseUrl).href,
				lastModified: new Date(),
			})),
		),
		...legalPaths.flatMap((path) =>
			locales.map((locale) => ({
				url: new URL(localePath(locale, `/legal/${path}`), baseUrl).href,
				lastModified: new Date(),
			})),
		),
	];

	return mergeSitemapUrls({
		baseUrl,
		defaultLocale,
		locales,
		fileEntries,
		dbPages,
	});
}
