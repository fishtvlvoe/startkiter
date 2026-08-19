import { readPublishedCourseCatalog } from "@startkiter/course/catalog";
import { db } from "@startkiter/database";

/** Database adapter for the course package's published-only catalog policy. */
export async function readPublishedCourseCatalogFromDatabase(courseId?: string) {
	return readPublishedCourseCatalog({
		findLessons: async () => {
			const lessons = await db.lesson.findMany({
				...(courseId ? { where: { chapter: { courseId } } } : {}),
				select: {
					id: true,
					isFreePreview: true,
					order: true,
					slug: true,
					status: true,
					title: true,
					videoDuration: true,
					chapter: {
						select: {
							id: true,
							order: true,
							title: true,
							course: { select: { status: true } },
						},
					},
				},
			});
			return lessons.map((lesson) => ({
				chapterId: lesson.chapter.id,
				chapterOrder: lesson.chapter.order,
				chapterTitle: lesson.chapter.title,
				courseStatus: lesson.chapter.course.status,
				id: lesson.id,
				isFreePreview: lesson.isFreePreview,
				lessonStatus: lesson.status,
				order: lesson.order,
				slug: lesson.slug,
				title: lesson.title,
				videoDuration: lesson.videoDuration,
			}));
		},
	});
}
