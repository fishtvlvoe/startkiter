import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		course: { findMany: vi.fn() },
		courseSubscription: { findMany: vi.fn() },
		courseInviteRedemption: { findMany: vi.fn() },
		order: { findMany: vi.fn() },
		user: { findUnique: vi.fn() },
		courseInstructor: { findUnique: vi.fn() },
	},
}));

import { db } from "@startkiter/database";

import { getCourseDashboardMetrics } from "./course-dashboard";

describe("course dashboard metrics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.user.findUnique).mockResolvedValue({ email: "admin@example.com", role: "admin" } as never);
		vi.mocked(db.course.findMany).mockResolvedValue([
			{ id: "course-1", slug: "course-1" },
			{ id: "course-2", slug: "course-2" },
		] as never);
		vi.mocked(db.courseSubscription.findMany).mockResolvedValue([{ userId: "student-1" }] as never);
		vi.mocked(db.courseInviteRedemption.findMany).mockResolvedValue([{ userId: "student-2" }] as never);
		vi.mocked(db.order.findMany).mockResolvedValue([
			{ amount: 8800, userId: "student-3", sku: "course-1" },
			{ amount: 1200, userId: "student-1", sku: "course-2" },
		] as never);
	});

	it("returns all three operator metrics from existing tables", async () => {
		await expect(getCourseDashboardMetrics("operator-1")).resolves.toEqual({
			publishedCourseCount: 2,
			studentCount: 3,
			revenueLast30Days: 10000,
		});
	});

	it("limits instructor metrics to the assigned course scope", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValue({ email: "teacher@example.com", role: "instructor" } as never);
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue({ id: "assignment" } as never);
		vi.mocked(db.course.findMany).mockResolvedValue([{ id: "course-1", slug: "course-1" }] as never);

		await expect(getCourseDashboardMetrics("teacher-1")).resolves.toEqual({
			publishedCourseCount: 1,
			studentCount: 3,
			revenueLast30Days: 8800,
		});
		expect(db.course.findMany).toHaveBeenCalledWith({
			where: { OR: [{ instructors: { none: {} } }, { instructors: { some: { userId: "teacher-1" } } }], status: "PUBLISHED" },
			select: { id: true, slug: true },
		});
	});
});
