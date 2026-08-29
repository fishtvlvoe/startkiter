export type ContentTypeValue = "POST" | "PAGE";
export type ContentStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PageSnapshot = {
	type: ContentTypeValue;
	slug: string;
	locale: string;
	title: string;
	excerpt: string | null;
	body: string;
	coverImageUrl: string | null;
	seoTitle: string | null;
	seoDescription: string | null;
	tags: string[];
	status: ContentStatusValue;
	publishedAt: Date | string | null;
};

export type PageRecord = PageSnapshot & {
	id: string;
	previousSnapshot: PageSnapshot | null;
};

export function snapshotPage(page: PageSnapshot): PageSnapshot {
	return {
		type: page.type,
		slug: page.slug,
		locale: page.locale,
		title: page.title,
		excerpt: page.excerpt,
		body: page.body,
		coverImageUrl: page.coverImageUrl,
		seoTitle: page.seoTitle,
		seoDescription: page.seoDescription,
		tags: [...page.tags],
		status: page.status,
		publishedAt: page.publishedAt,
	};
}

export function restorePage(
	page: PageRecord,
): { ok: true; page: PageRecord } | { ok: false; status: 409 } {
	if (!page.previousSnapshot) {
		return { ok: false, status: 409 };
	}

	const replaced = snapshotPage(page);
	return {
		ok: true,
		page: {
			id: page.id,
			...snapshotPage(page.previousSnapshot),
			previousSnapshot: replaced,
		},
	};
}
