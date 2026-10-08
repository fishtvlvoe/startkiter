import { describe, expect, it } from "vitest";
import { resolveStudioQuickAction } from "./studio-quick-action";

describe("resolveStudioQuickAction", () => {
	const sampleCourses = [
		{
			id: "course-a",
			title: "Course A",
			chapters: [
				{ id: "ch-1", title: "Chapter 1", order: 1 },
				{ id: "ch-3", title: "Chapter 3", order: 3 },
				{ id: "ch-2", title: "Chapter 2", order: 2 },
			],
		},
		{
			id: "course-b",
			title: "Course B",
			chapters: [
				{ id: "ch-b1", title: "Chapter B1", order: 1 },
			],
		},
	];

	// 列 1: action = new-course，任何課程組合皆開啟新增課程視窗
	it("new-course 動作開啟新增課程視窗", () => {
		const result = resolveStudioQuickAction("new-course", sampleCourses);
		expect(result).toEqual({ type: "open-course-dialog" });
	});

	// 列 2: action = new-lesson，選第一門課中 order 最大的章節開啟新增單元視窗
	it("new-lesson 動作在有章節時選取第一門課 order 最大的章節開啟新增單元視窗", () => {
		const result = resolveStudioQuickAction("new-lesson", sampleCourses);
		expect(result).toEqual({
			type: "open-lesson-dialog",
			courseId: "course-a",
			chapterId: "ch-3",
			courseTitle: "Course A",
			chapterTitle: "Chapter 3",
		});
	});

	// 列 3: action = new-lesson，第一門課沒有章節時回傳錯誤提示
	it("new-lesson 動作在第一門課沒有章節時回傳「請先新增章節，再新增單元」錯誤", () => {
		const coursesWithNoChapters = [
			{
				id: "course-a",
				title: "Course A",
				chapters: [],
			},
		];
		const result = resolveStudioQuickAction("new-lesson", coursesWithNoChapters);
		expect(result).toEqual({
			type: "error",
			message: "請先新增章節，再新增單元",
		});
	});

	// 列 4: action = new-lesson，沒有任何課程時回傳錯誤提示
	it("new-lesson 動作在沒有課程時回傳「請先新增課程，再新增單元」錯誤", () => {
		const result = resolveStudioQuickAction("new-lesson", []);
		expect(result).toEqual({
			type: "error",
			message: "請先新增課程，再新增單元",
		});
	});

	// 列 5: action = delete-all（不支援的 action），忽略且不開視窗
	it("未支援的 action（如 delete-all）回傳 none", () => {
		const result = resolveStudioQuickAction("delete-all", sampleCourses);
		expect(result).toEqual({ type: "none" });
	});

	// 列 6: action 未帶（null），忽略且不開視窗
	it("未帶 action（null）回傳 none", () => {
		const result = resolveStudioQuickAction(null, sampleCourses);
		expect(result).toEqual({ type: "none" });
	});
});
