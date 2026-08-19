import { describe, expect, it } from "vitest";

import { readPublishedCourseCatalog } from "./catalog";

describe("published course catalog", () => {
	it("filters draft data and orders chapters and lessons deterministically", async () => {
		const catalog = await readPublishedCourseCatalog({
			findLessons: async () => [
				{ chapterId: "chapter-b", chapterOrder: 1, chapterTitle: "第二章", courseStatus: "PUBLISHED", id: "lesson-b", isFreePreview: false, lessonStatus: "PUBLISHED", order: 0, slug: "lesson-b", title: "B", videoDuration: "02:00" },
				{ chapterId: "chapter-a", chapterOrder: 0, chapterTitle: "第一章", courseStatus: "PUBLISHED", id: "lesson-a2", isFreePreview: false, lessonStatus: "PUBLISHED", order: 1, slug: "lesson-a2", title: "A2", videoDuration: "02:00" },
				{ chapterId: "chapter-a", chapterOrder: 0, chapterTitle: "第一章", courseStatus: "PUBLISHED", id: "lesson-draft", isFreePreview: false, lessonStatus: "DRAFT", order: 0, slug: "lesson-draft", title: "草稿", videoDuration: "02:00" },
				{ chapterId: "chapter-a", chapterOrder: 0, chapterTitle: "第一章", courseStatus: "PUBLISHED", id: "lesson-a1", isFreePreview: true, lessonStatus: "PUBLISHED", order: 0, slug: "lesson-a1", title: "A1", videoDuration: "02:00" },
				{ chapterId: "chapter-hidden", chapterOrder: 0, chapterTitle: "草稿課", courseStatus: "DRAFT", id: "lesson-hidden", isFreePreview: false, lessonStatus: "PUBLISHED", order: 0, slug: "lesson-hidden", title: "不公開", videoDuration: "02:00" },
			],
		});

		expect(catalog).toEqual([
			{ id: "chapter-a", lessons: [expect.objectContaining({ id: "lesson-a1" }), expect.objectContaining({ id: "lesson-a2" })], title: "第一章" },
			{ id: "chapter-b", lessons: [expect.objectContaining({ id: "lesson-b" })], title: "第二章" },
		]);
	});
});
