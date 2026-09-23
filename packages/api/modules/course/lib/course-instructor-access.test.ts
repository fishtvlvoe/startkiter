import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		user: {
			findUnique: vi.fn(),
		},
		courseInstructor: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

import { db } from "@startkiter/database";

import {
	canManageCourse,
	hasAnyCourseInstructorAssignment,
	manageableCourseWhereForUser,
	requireCourseManageAccess,
} from "./course-instructor-access";

describe("course instructor scoped access", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.user.findUnique).mockResolvedValue({ email: "instructor@example.com", role: "instructor" } as never);
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

	it("allows an instructor to manage an unassigned course", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);
		vi.mocked(db.courseInstructor.findFirst).mockResolvedValue(null);
		vi.mocked(db.courseInstructor.findFirst).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "any-assignment" } as never);

		await expect(
			canManageCourse({ userId: "instructor-1", courseId: "course-unassigned", isOperator: false }),
		).resolves.toBe(true);
	});

	it("rejects an instructor from a course they do not own", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);
		vi.mocked(db.courseInstructor.findFirst).mockResolvedValue({ id: "other-assignment" } as never);

		await expect(
			canManageCourse({ userId: "instructor-1", courseId: "course-other", isOperator: false }),
		).resolves.toBe(false);
	});

	it("rejects a normal user with no assignment", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);
		vi.mocked(db.courseInstructor.findFirst).mockResolvedValue({ id: "other-assignment" } as never);

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

	it("rejects unauthorized course access without revealing course data", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);

		await expect(requireCourseManageAccess("instructor-1", "course-other")).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("returns only assigned courses for an instructor", async () => {
		await expect(manageableCourseWhereForUser("instructor-1")).resolves.toEqual({
			OR: [{ instructors: { none: {} } }, { instructors: { some: { userId: "instructor-1" } } }],
		});
	});

	it("returns an unrestricted filter for an operator", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValue({ email: "admin@example.com", role: "admin" } as never);

		await expect(manageableCourseWhereForUser("operator-1")).resolves.toEqual({});
	});

	it("returns only explicitly assigned courses for a learner without instructor role", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValue({ email: "learner@example.com", role: "user" } as never);

		await expect(manageableCourseWhereForUser("learner-1")).resolves.toEqual({ instructors: { some: { userId: "learner-1" } } });
	});
});
