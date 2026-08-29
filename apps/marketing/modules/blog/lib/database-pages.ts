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

async function queryPublishedPages(): Promise<DatabasePublicPage[]> {
	if (!process.env.DATABASE_URL) {
		return [];
	}

	try {
		const { db } = await import("@startkiter/database");
		return db.page.findMany({
			where: { status: "PUBLISHED" },
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
	const pages = await queryPublishedPages();
	return type ? pages.filter((page) => page.type === type) : pages;
}

export async function getPublishedDatabasePage(input: {
	slug: string;
	locale: string;
	type: "POST" | "PAGE";
	fallbackLocale?: string;
}): Promise<DatabasePublicPage | null> {
	const pages = await listPublishedDatabasePages(input.type);
	const matches = pages.filter((page) => page.slug === input.slug);
	if (matches.length === 0) return null;
	return (
		matches.find((page) => page.locale === input.locale) ??
		matches.find((page) => page.locale === (input.fallbackLocale ?? "zh-tw")) ??
		matches[0] ??
		null
	);
}
