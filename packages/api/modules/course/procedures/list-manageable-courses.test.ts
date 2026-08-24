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
		course: {
			findMany: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { listManageableCourses } from "./list-manageable-courses";

describe("course.listManageableCourses", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "operator-1" },
			user: { id: "operator-1", email: "operator@example.com", role: "user" },
		} as never);
		vi.mocked(db.course.findMany).mockResolvedValue([] as never);
	});

	it("returns every course to the operator", async () => {
		const courses = [{ id: "course-1" }, { id: "course-2" }];
		vi.mocked(db.course.findMany).mockResolvedValue(courses as never);

		await expect(
			call(listManageableCourses, {}, { context: { headers: new Headers() } }),
		).resolves.toEqual({ courses });

		expect(db.course.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
	});

	it("returns only courses assigned to an instructor", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "instructor-1" },
			user: { id: "instructor-1", email: "instructor@example.com", role: "user" },
		} as never);
		const courses = [{ id: "course-assigned" }];
		vi.mocked(db.course.findMany).mockResolvedValue(courses as never);

		await expect(
			call(listManageableCourses, {}, { context: { headers: new Headers() } }),
		).resolves.toEqual({ courses });

		expect(db.course.findMany).toHaveBeenCalledWith({
			where: { instructors: { some: { userId: "instructor-1" } } },
			orderBy: { createdAt: "desc" },
		});
	});

	it("returns an empty list when the instructor has no assignments", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-3", userId: "instructor-2" },
			user: { id: "instructor-2", email: "instructor@example.com", role: "user" },
		} as never);

		await expect(
			call(listManageableCourses, {}, { context: { headers: new Headers() } }),
		).resolves.toEqual({ courses: [] });
	});
});
