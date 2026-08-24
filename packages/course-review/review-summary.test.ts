import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { getCourseReviewSummary } from "./review-summary";

describe.sequential("course review summary", () => {
	const createdReviewIds: string[] = [];
	const createdUserIds: string[] = [];

	it("computes the average rating and count from reviews without a Course cache", async () => {
		const firstUser = await db.user.create({
			data: {
				name: "First review learner",
				email: `course-review-summary-a-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		const secondUser = await db.user.create({
			data: {
				name: "Second review learner",
				email: `course-review-summary-b-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(firstUser.id, secondUser.id);

		for (const [userId, rating] of [[firstUser.id, 5], [secondUser.id, 3]] as const) {
			const review = await db.courseReview.create({
				data: { courseId: "course-review-summary-course", userId, rating },
			});
			createdReviewIds.push(review.id);
		}

		expect(await getCourseReviewSummary("course-review-summary-course")).toEqual({
			averageRating: 4,
			reviewCount: 2,
		});
	});

	afterEach(async () => {
		for (const reviewId of createdReviewIds.splice(0)) {
			await db.courseReview.delete({ where: { id: reviewId } }).catch(() => undefined);
		}
		for (const userId of createdUserIds.splice(0)) {
			await db.user.delete({ where: { id: userId } }).catch(() => undefined);
		}
	});

	afterAll(async () => {
		await db.$disconnect();
	});
});
