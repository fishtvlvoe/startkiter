import { randomUUID } from "node:crypto";

import { db } from "../../prisma/client";
import { afterAll, afterEach, describe, expect, it } from "vitest";

describe.sequential("CourseReview database constraints", () => {
	const createdReviewIds: string[] = [];
	const createdUserIds: string[] = [];

	it("rejects a second review from the same learner for the same course", async () => {
		const user = await db.user.create({
			data: {
				name: "Course review test learner",
				email: `course-review-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(user.id);

		const firstReview = await db.courseReview.create({
			data: {
				courseId: "course-review-test-course",
				userId: user.id,
				rating: 5,
				content: "很實用。",
			},
		});
		createdReviewIds.push(firstReview.id);

		await expect(
			db.courseReview.create({
				data: {
					courseId: firstReview.courseId,
					userId: user.id,
					rating: 4,
					content: "再次評價。",
				},
			}),
		).rejects.toMatchObject({ code: "P2002" });
	});

	it("enforces rating bounds and one helpful vote/report per learner", async () => {
		const author = await db.user.create({
			data: {
				name: "Course review author",
				email: `course-review-author-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		const voter = await db.user.create({
			data: {
				name: "Course review voter",
				email: `course-review-voter-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(author.id, voter.id);

		const review = await db.courseReview.create({
			data: { courseId: "course-review-constraint-course", userId: author.id, rating: 5 },
		});
		createdReviewIds.push(review.id);

		await expect(
			db.courseReview.create({
				data: { courseId: "course-review-invalid-rating", userId: voter.id, rating: 6 },
			}),
		).rejects.toThrow();

		await db.reviewHelpful.create({ data: { reviewId: review.id, userId: voter.id } });
		await expect(db.reviewHelpful.create({ data: { reviewId: review.id, userId: voter.id } })).rejects.toMatchObject({ code: "P2002" });

		await db.reviewReport.create({ data: { reviewId: review.id, userId: voter.id, reason: "不當內容" } });
		await expect(db.reviewReport.create({ data: { reviewId: review.id, userId: voter.id, reason: "重複檢舉" } })).rejects.toMatchObject({ code: "P2002" });
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
