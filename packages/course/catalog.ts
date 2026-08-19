export type LessonSummary = {
	id: string;
	isFreePreview: boolean;
	order: number;
	slug: string;
	title: string;
	videoDuration: string | null;
};

export type PublishedLessonRow = LessonSummary & {
	chapterId: string;
	chapterOrder: number;
	chapterTitle: string;
	courseStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	lessonStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type PublishedCourseCatalogReader = {
	findLessons: () => Promise<readonly PublishedLessonRow[]>;
};

export type PublishedCourseCatalog = Array<{
	id: string;
	lessons: LessonSummary[];
	title: string;
}>;

/**
 * The package owns public-reader filtering and deterministic ordering; the API
 * package supplies the database reader. It intentionally contains no seed data
 * or fallback media URLs.
 */
export async function readPublishedCourseCatalog(
	reader: PublishedCourseCatalogReader,
): Promise<PublishedCourseCatalog> {
	const rows = (await reader.findLessons())
		.filter((row) => row.courseStatus === "PUBLISHED" && row.lessonStatus === "PUBLISHED")
		.slice()
		.sort(
			(a, b) =>
				a.chapterOrder - b.chapterOrder ||
				a.chapterId.localeCompare(b.chapterId) ||
				a.order - b.order ||
				a.id.localeCompare(b.id),
		);

	const chapters = new Map<string, { id: string; lessons: LessonSummary[]; title: string }>();
	for (const row of rows) {
		const chapter = chapters.get(row.chapterId) ?? {
			id: row.chapterId,
			lessons: [],
			title: row.chapterTitle,
		};
		chapter.lessons.push({
			id: row.id,
			isFreePreview: row.isFreePreview,
			order: row.order,
			slug: row.slug,
			title: row.title,
			videoDuration: row.videoDuration,
		});
		chapters.set(row.chapterId, chapter);
	}
	return [...chapters.values()];
}
