import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		courseInstructor: {
			upsert: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { assignCourseInstructor } from "./assign-course-instructor";

describe("course.assignCourseInstructor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "operator-1" },
			user: { id: "operator-1", email: "operator@example.com", role: "user" },
		} as never);
		vi.mocked(db.courseInstructor.upsert).mockResolvedValue({
			id: "assignment-1",
			courseId: "course-1",
			userId: "instructor-1",
			createdById: "operator-1",
		} as never);
	});

	it("lets an operator assign a user to a course", async () => {
		await expect(
			call(
				assignCourseInstructor,
				{ courseId: "course-1", userId: "instructor-1" },
				{ context: { headers: new Headers() } },
			),
		).resolves.toMatchObject({ assigned: true });

		expect(db.courseInstructor.upsert).toHaveBeenCalledWith({
			where: { courseId_userId: { courseId: "course-1", userId: "instructor-1" } },
			update: {},
			create: { courseId: "course-1", userId: "instructor-1", createdById: "operator-1" },
		});
	});

	it("rejects a non-operator", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "user-1" },
			user: { id: "user-1", email: "user@example.com", role: "user" },
		} as never);

		await expect(
			call(
				assignCourseInstructor,
				{ courseId: "course-1", userId: "instructor-1" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(db.courseInstructor.upsert).not.toHaveBeenCalled();
	});

	it("is idempotent for a duplicate course and user assignment", async () => {
		await expect(
			call(
				assignCourseInstructor,
				{ courseId: "course-1", userId: "instructor-1" },
				{ context: { headers: new Headers() } },
			),
		).resolves.toMatchObject({ assigned: true });

		await expect(
			call(
				assignCourseInstructor,
				{ courseId: "course-1", userId: "instructor-1" },
				{ context: { headers: new Headers() } },
			),
		).resolves.toMatchObject({ assigned: true });

		expect(db.courseInstructor.upsert).toHaveBeenCalledTimes(2);
	});
});
