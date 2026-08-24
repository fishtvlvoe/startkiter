import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/course-review", () => ({
	getCourseReviewSummary: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
		db: {
		course: { findUnique: vi.fn() },
		lesson: { findUnique: vi.fn(), count: vi.fn() },
		lessonProgress: { count: vi.fn() },
		courseReview: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
		reviewHelpful: { create: vi.fn() },
		lessonComment: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
		reviewReport: { findMany: vi.fn(), create: vi.fn() },
		$transaction: vi.fn(),
	},
}));

vi.mock("../course/lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { userCanAccessCourseId } from "../course/lib/course-access";

import { reviewRouter } from "./router";

describe("review router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "learner-1", email: "learner@example.com", role: "user" },
			session: { id: "session-1", userId: "learner-1" },
		} as never);
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);
		vi.mocked(db.lesson.count).mockResolvedValue(1);
		vi.mocked(db.lessonProgress.count).mockResolvedValue(1);
	});

	it("maps the database unique constraint to a conflict when a learner reviews twice", async () => {
		vi.mocked(db.course.findUnique).mockResolvedValue({ id: "course-1" } as never);
		vi.mocked(db.courseReview.create).mockRejectedValue({ code: "P2002" });

		await expect(
			call(
				reviewRouter.create,
				{ courseId: "course-1", rating: 5, content: "很好" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	it("requires a learner to complete the course before creating a review", async () => {
		vi.mocked(db.course.findUnique).mockResolvedValue({ id: "course-1" } as never);
		vi.mocked(db.lesson.count).mockResolvedValue(2);
		vi.mocked(db.lessonProgress.count).mockResolvedValue(1);

		await expect(
			call(
				reviewRouter.create,
				{ courseId: "course-1", rating: 5, content: "很好" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(db.courseReview.create).not.toHaveBeenCalled();
	});

	it("increments helpfulCount in the same transaction as the helpful vote", async () => {
		vi.mocked(db.course.findUnique).mockResolvedValue({ id: "course-1" } as never);
		vi.mocked(db.courseReview.findUnique).mockResolvedValue({ id: "review-1", courseId: "course-1", isVisible: true } as never);
		const transactionClient = {
			reviewHelpful: { create: vi.fn().mockResolvedValue({ id: "helpful-1" }) },
			courseReview: { update: vi.fn().mockResolvedValue({ id: "review-1", helpfulCount: 1 }) },
		};
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(transactionClient as never));

		await expect(
			call(reviewRouter.markHelpful, { reviewId: "review-1" }, { context: { headers: new Headers() } }),
		).resolves.toEqual({ helpful: true });

		expect(transactionClient.reviewHelpful.create).toHaveBeenCalledWith({ data: { reviewId: "review-1", userId: "learner-1" } });
		expect(transactionClient.courseReview.update).toHaveBeenCalledWith({
			where: { id: "review-1" },
			data: { helpfulCount: { increment: 1 } },
		});
	});
});
