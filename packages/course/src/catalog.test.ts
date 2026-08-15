import { describe, expect, it } from "vitest";

import { buildBunnyEmbedUrl, getLesson, listLessons, resolveLessonMedia } from "./catalog";

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

	it("uses Bunny embed when library id is configured", () => {
		const lesson = getLesson("lesson-01", { BUNNY_LIBRARY_ID: "416184" });
		expect(lesson?.mediaKind).toBe("bunny_embed");
		expect(lesson?.isDemoFallback).toBe(false);
		expect(lesson?.mediaUrl).toBe(
			buildBunnyEmbedUrl("416184", "efc1790b-83a8-46e4-a319-4d2b2761b9bc"),
		);
	});

	it("falls back to placeholder when Bunny library missing", () => {
		const lesson = getLesson("lesson-01", {});
		expect(lesson?.mediaKind).toBe("placeholder");
		expect(lesson?.isDemoFallback).toBe(true);
		expect(lesson?.mediaUrl).toContain("flower.mp4");
	});

	it("allows env override per lesson video id", () => {
		const media = resolveLessonMedia(
			{
				id: "lesson-02",
				title: "t",
				order: 2,
				description: "d",
				bunnyVideoId: "default-guid",
			},
			{ BUNNY_LIBRARY_ID: "416184", BUNNY_LESSON_02_VIDEO_ID: "custom-guid" },
		);
		expect(media.mediaUrl).toContain("custom-guid");
	});
});
