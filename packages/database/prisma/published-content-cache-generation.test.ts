import { beforeEach, describe, expect, it } from "vitest";

import {
	bumpPublishedContentCacheGeneration,
	getPublishedContentCacheGeneration,
	isCourseContentWrite,
	resetPublishedContentCacheGenerationForTests,
} from "./published-content-cache-generation";

describe("published content cache generation", () => {
	beforeEach(() => {
		resetPublishedContentCacheGenerationForTests();
	});

	it("bumps a monotonic generation counter", () => {
		expect(getPublishedContentCacheGeneration()).toBe(0);
		expect(bumpPublishedContentCacheGeneration()).toBe(1);
		expect(bumpPublishedContentCacheGeneration()).toBe(2);
		expect(getPublishedContentCacheGeneration()).toBe(2);
	});

	it("treats course/chapter/lesson/watermark mutations as content writes", () => {
		expect(isCourseContentWrite("Course", "update")).toBe(true);
		expect(isCourseContentWrite("Chapter", "create")).toBe(true);
		expect(isCourseContentWrite("Lesson", "delete")).toBe(true);
		expect(isCourseContentWrite("CourseVideoWatermarkSetting", "upsert")).toBe(true);
		expect(isCourseContentWrite("Lesson", "createMany")).toBe(true);
	});

	it("ignores reads and unrelated models", () => {
		expect(isCourseContentWrite("Lesson", "findUnique")).toBe(false);
		expect(isCourseContentWrite("LessonProgress", "update")).toBe(false);
		expect(isCourseContentWrite(undefined, "update")).toBe(false);
	});
});
