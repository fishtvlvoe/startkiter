export const SITEMAP_REVALIDATE_SECONDS = 300;

export type FileSitemapEntry = {
	url: string;
	lastModified: Date;
};

export type DatabasePageSitemapEntry = {
	slug: string;
	locale: string;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	type: "POST" | "PAGE";
	updatedAt: Date;
};

export type SitemapUrl = {
	url: string;
	lastModified: Date;
};

function localePath(locale: string, defaultLocale: string, path: string): string {
	const prefix = locale === defaultLocale ? "" : `/${locale}`;
	return `${prefix}${path}`;
}

export function mergeSitemapUrls(input: {
	baseUrl: string;
	defaultLocale: string;
	locales: string[];
	fileEntries: FileSitemapEntry[];
	dbPages: DatabasePageSitemapEntry[];
}): SitemapUrl[] {
	const dbEntries = input.dbPages
		.filter((page) => page.status === "PUBLISHED")
		.map((page) => {
			const path = page.type === "POST" ? `/blog/${page.slug}` : `/${page.slug}`;
			return {
				url: new URL(localePath(page.locale, input.defaultLocale, path), input.baseUrl).href,
				lastModified: page.updatedAt,
			};
		});

	return [...input.fileEntries, ...dbEntries];
}
