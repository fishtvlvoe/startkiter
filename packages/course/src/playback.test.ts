import { describe, expect, it } from "vitest";

import { decideLessonPlayback } from "./playback";

describe("decideLessonPlayback", () => {
	it("unauthorized without session", () => {
		expect(
			decideLessonPlayback({
				sessionPresent: false,
				hasCourseAccess: true,
				lessonExists: true,
				lessonId: "lesson-01",
			}).status,
		).toBe("unauthorized");
	});

	it("forbidden without courseAccess", () => {
		expect(
			decideLessonPlayback({
				sessionPresent: true,
				hasCourseAccess: false,
				lessonExists: true,
				lessonId: "lesson-01",
			}).status,
		).toBe("forbidden");
	});

	it("not_found for unknown lesson when entitled", () => {
		expect(
			decideLessonPlayback({
				sessionPresent: true,
				hasCourseAccess: true,
				lessonExists: false,
				lessonId: "missing",
			}).status,
		).toBe("not_found");
	});

	it("ok when session + access + lesson", () => {
		expect(
			decideLessonPlayback({
				sessionPresent: true,
				hasCourseAccess: true,
				lessonExists: true,
				lessonId: "lesson-01",
			}),
		).toEqual({ status: "ok", lessonId: "lesson-01" });
	});
});
