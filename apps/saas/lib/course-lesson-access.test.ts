import { describe, expect, it } from "vitest";

import { canReadCourseLesson } from "./course-lesson-access";

describe("canReadCourseLesson", () => {
	it("allows published trial lessons without a paid order", () => {
		expect(
			canReadCourseLesson({
				hasCourseAccess: false,
				isFreePreview: true,
				status: "PUBLISHED",
			}),
		).toBe(true);
	});

	it("blocks unpublished and paid-only lessons for a user without access", () => {
		expect(
			canReadCourseLesson({
				hasCourseAccess: false,
				isFreePreview: false,
				status: "PUBLISHED",
			}),
		).toBe(false);
		expect(
			canReadCourseLesson({
				hasCourseAccess: true,
				isFreePreview: true,
				status: "DRAFT",
			}),
		).toBe(false);
	});
});
