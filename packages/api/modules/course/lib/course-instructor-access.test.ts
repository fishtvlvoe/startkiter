import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		courseInstructor: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

import { db } from "@startkiter/database";

import { canManageCourse, hasAnyCourseInstructorAssignment } from "./course-instructor-access";

describe("course instructor scoped access", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("allows an operator to manage any course without a database lookup", async () => {
		await expect(
			canManageCourse({ userId: "operator-1", courseId: "course-other", isOperator: true }),
		).resolves.toBe(true);

		expect(db.courseInstructor.findUnique).not.toHaveBeenCalled();
	});

	it("allows an instructor to manage an assigned course", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue({ id: "assignment-1" } as never);

		await expect(
			canManageCourse({ userId: "instructor-1", courseId: "course-assigned", isOperator: false }),
		).resolves.toBe(true);

		expect(db.courseInstructor.findUnique).toHaveBeenCalledWith({
			where: { courseId_userId: { courseId: "course-assigned", userId: "instructor-1" } },
			select: { id: true },
		});
	});

	it("rejects an instructor from a course they do not own", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);

		await expect(
			canManageCourse({ userId: "instructor-1", courseId: "course-other", isOperator: false }),
		).resolves.toBe(false);
	});

	it("rejects a normal user with no assignment", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);

		await expect(
			canManageCourse({ userId: "user-1", courseId: "course-1", isOperator: false }),
		).resolves.toBe(false);
	});

	it("checks whether a user has any assignment with one minimal lookup", async () => {
		vi.mocked(db.courseInstructor.findFirst).mockResolvedValue({ id: "assignment-1" } as never);

		await expect(hasAnyCourseInstructorAssignment("instructor-1")).resolves.toBe(true);
		expect(db.courseInstructor.findFirst).toHaveBeenCalledTimes(1);
		expect(db.courseInstructor.findFirst).toHaveBeenCalledWith({
			where: { userId: "instructor-1" },
			select: { id: true },
		});
	});
});
