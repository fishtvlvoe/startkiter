import { describe, expect, it } from "vitest";

import { getLesson, listLessons } from "./catalog";

describe("lesson catalog", () => {
	it("lists MVP lesson ids and titles", () => {
		const lessons = listLessons();
		expect(lessons.length).toBeGreaterThanOrEqual(1);
		expect(lessons[0]?.id).toBe("lesson-01");
		expect(lessons.every((l) => typeof l.title === "string" && l.title.length > 0)).toBe(true);
	});

	it("returns null for unknown lesson id", () => {
		expect(getLesson("lesson-does-not-exist")).toBeNull();
	});

	it("returns detail including media for known id", () => {
		const lesson = getLesson("lesson-01");
		expect(lesson?.mediaUrl).toBeTruthy();
		expect(lesson?.title).toContain("開站包");
	});
});
