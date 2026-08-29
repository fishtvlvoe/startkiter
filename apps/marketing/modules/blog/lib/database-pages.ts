export type DatabasePublicPage = {
	id: string;
	type: "POST" | "PAGE";
	slug: string;
	locale: string;
	title: string;
	excerpt: string | null;
	body: string;
	coverImageUrl: string | null;
	seoTitle: string | null;
	seoDescription: string | null;
	tags: string[];
	publishedAt: Date | null;
	updatedAt: Date;
};

export const DEFAULT_CONTENT_LOCALE = "zh-tw";

export function pickLocalizedPage<T extends { locale: string }>(
	pages: T[],
	locale: string,
	fallbackLocale: string = DEFAULT_CONTENT_LOCALE,
): T | null {
	return (
		pages.find((page) => page.locale === locale) ??
		pages.find((page) => page.locale === fallbackLocale) ??
		null
	);
}

async function queryPublishedPages(type?: "POST" | "PAGE"): Promise<DatabasePublicPage[]> {
	if (!process.env.DATABASE_URL) {
		return [];
	}

	try {
		const { db } = await import("@startkiter/database");
		return db.page.findMany({
			where: {
				status: "PUBLISHED",
				...(type ? { type } : {}),
			},
			select: {
				id: true,
				type: true,
				slug: true,
				locale: true,
				title: true,
				excerpt: true,
				body: true,
				coverImageUrl: true,
				seoTitle: true,
				seoDescription: true,
				tags: true,
				publishedAt: true,
				updatedAt: true,
			},
		});
	} catch {
		return [];
	}
}

export async function listPublishedDatabasePages(type?: "POST" | "PAGE"): Promise<DatabasePublicPage[]> {
	return queryPublishedPages(type);
}

export async function getPublishedDatabasePage(input: {
	slug: string;
	locale: string;
	type: "POST" | "PAGE";
	fallbackLocale?: string;
}): Promise<DatabasePublicPage | null> {
	const pages = (await listPublishedDatabasePages(input.type)).filter((page) => page.slug === input.slug);
	if (pages.length === 0) return null;
	return pickLocalizedPage(pages, input.locale, input.fallbackLocale ?? DEFAULT_CONTENT_LOCALE);
}
