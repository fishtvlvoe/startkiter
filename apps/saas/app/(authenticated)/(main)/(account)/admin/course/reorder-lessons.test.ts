import { describe, expect, it, vi } from "vitest";

import { reorderLesson } from "./reorder-lessons";

describe("Course Studio lesson reorder", () => {
	it("把單元拖到另一章節指定位置並呼叫 reorder_lessons", async () => {
		const persist = vi.fn().mockResolvedValue({ ok: true });
		const chapters = [
			{
				id: "chapter-01",
				lessons: [
					{ id: "lesson-01", title: "第一課" },
					{ id: "lesson-02", title: "第二課" },
				],
			},
			{
				id: "chapter-02",
				lessons: [
					{ id: "lesson-03", title: "第三課" },
					{ id: "lesson-04", title: "第四課" },
				],
			},
		];

		const nextChapters = await reorderLesson(
			chapters,
			"lesson-02",
			"chapter-02",
			1,
			persist,
		);

		expect(persist).toHaveBeenCalledWith({
			moves: [
				{ lessonId: "lesson-02", chapterId: "chapter-02", order: 1 },
				{ lessonId: "lesson-04", chapterId: "chapter-02", order: 2 },
			],
		});
		expect(nextChapters[1]?.lessons.map((lesson) => lesson.id)).toEqual([
				"lesson-03",
				"lesson-02",
				"lesson-04",
		]);
	});

	it.each([
		["第一項", 0, ["lesson-02", "lesson-03", "lesson-04"], 0],
		["最後一項", 3, ["lesson-03", "lesson-04", "lesson-02"], 1],
		["中間項", 1, ["lesson-03", "lesson-02", "lesson-04"], 1],
	])(
		"以 0-based index 把單元移到%s",
		async (_label, targetIndex, expectedIds, expectedPersistCalls) => {
			const persist = vi.fn().mockResolvedValue({ ok: true });
			const chapters = [
				{
					id: "chapter-01",
					lessons: [{ id: "lesson-01" }],
				},
				{
					id: "chapter-02",
					lessons: [
						{ id: "lesson-02" },
						{ id: "lesson-03" },
						{ id: "lesson-04" },
					],
				},
			];

			const nextChapters = await reorderLesson(
				chapters,
				"lesson-02",
				"chapter-02",
				targetIndex,
				persist,
			);

			expect(nextChapters[1]?.lessons.map((lesson) => lesson.id)).toEqual(expectedIds);
			expect(persist).toHaveBeenCalledTimes(expectedPersistCalls);
		},
	);
});
