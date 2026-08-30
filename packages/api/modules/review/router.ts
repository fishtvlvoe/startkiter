import { ORPCError } from "@orpc/server";
import { getCourseReviewSummary } from "@startkiter/course-review";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../orpc/procedures";
import { userCanAccessCourseId } from "../course/lib/course-access";
import { isOperator } from "@startkiter/permissions";
import { serializeLessonCommentForViewer } from "./lesson-comment";

const reviewOperatorProcedure = protectedProcedure.use(async ({ context, next }) => {
	if (!isOperator(context.user, process.env.ADMIN_EMAIL)) {
		throw new ORPCError("FORBIDDEN");
	}

	return next();
});

function isUniqueConstraintError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function requireCourseAccess(courseId: string, userId: string) {
	const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
	if (!course) throw new ORPCError("NOT_FOUND", { message: "找不到指定課程。" });
	if (!(await userCanAccessCourseId(userId, courseId))) throw new ORPCError("FORBIDDEN");
}

async function requireCourseCompletion(courseId: string, userId: string) {
	const [totalLessons, completedLessons] = await Promise.all([
		db.lesson.count({ where: { chapter: { courseId }, status: "PUBLISHED" } }),
		db.lessonProgress.count({ where: { userId, lesson: { chapter: { courseId }, status: "PUBLISHED" } } }),
	]);
	if (totalLessons === 0 || completedLessons < totalLessons) {
		throw new ORPCError("FORBIDDEN", { message: "完成課程後才能送出評價。" });
	}
}

async function requireLessonAccess(lessonId: string, userId: string) {
	const lesson = await db.lesson.findUnique({
		where: { id: lessonId },
		select: { id: true, chapter: { select: { courseId: true } } },
	});
	if (!lesson) throw new ORPCError("NOT_FOUND", { message: "找不到指定單元。" });
	if (!(await userCanAccessCourseId(userId, lesson.chapter.courseId))) throw new ORPCError("FORBIDDEN");
}

export const reviewRouter = {
	getSummary: protectedProcedure
		.route({ method: "GET", path: "/reviews/{courseId}/summary", tags: ["Reviews"], summary: "Get course review summary" })
		.input(z.object({ courseId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			await requireCourseAccess(input.courseId, context.user.id);
			return getCourseReviewSummary(input.courseId);
		}),

	list: protectedProcedure
		.route({ method: "GET", path: "/reviews/{courseId}", tags: ["Reviews"], summary: "List visible course reviews" })
		.input(z.object({ courseId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			await requireCourseAccess(input.courseId, context.user.id);
			const reviews = await db.courseReview.findMany({
				where: { courseId: input.courseId, isVisible: true },
				orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
				select: {
					id: true,
					rating: true,
					content: true,
					helpfulCount: true,
					replyContent: true,
					replyAt: true,
					createdAt: true,
					user: { select: { name: true } },
				},
			});
			return { reviews };
		}),

	create: protectedProcedure
		.route({ method: "POST", path: "/reviews", tags: ["Reviews"], summary: "Create a course review" })
		.input(z.object({ courseId: z.string().min(1), rating: z.number().int().min(1).max(5), content: z.string().trim().max(5000).nullable().optional() }))
		.handler(async ({ input, context }) => {
			await requireCourseAccess(input.courseId, context.user.id);
			await requireCourseCompletion(input.courseId, context.user.id);
			try {
				return await db.courseReview.create({
					data: { courseId: input.courseId, userId: context.user.id, rating: input.rating, content: input.content?.trim() || null },
				});
			} catch (error) {
				if (isUniqueConstraintError(error)) throw new ORPCError("CONFLICT", { message: "你已評價過這門課。" });
				throw error;
			}
		}),

		markHelpful: protectedProcedure
		.route({ method: "POST", path: "/reviews/{reviewId}/helpful", tags: ["Reviews"], summary: "Mark a review helpful" })
		.input(z.object({ reviewId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const review = await db.courseReview.findUnique({ where: { id: input.reviewId }, select: { id: true, courseId: true, isVisible: true } });
			if (!review || !review.isVisible) throw new ORPCError("NOT_FOUND");
			await requireCourseAccess(review.courseId, context.user.id);

			try {
				await db.$transaction(async (tx) => {
					await tx.reviewHelpful.create({ data: { reviewId: input.reviewId, userId: context.user.id } });
					await tx.courseReview.update({ where: { id: input.reviewId }, data: { helpfulCount: { increment: 1 } } });
				});
			} catch (error) {
				if (!isUniqueConstraintError(error)) throw error;
			}
			return { helpful: true };
		}),

	report: protectedProcedure
		.route({ method: "POST", path: "/reviews/{reviewId}/reports", tags: ["Reviews"], summary: "Report a review" })
		.input(z.object({ reviewId: z.string().min(1), reason: z.string().trim().min(1).max(1000) }))
		.handler(async ({ input, context }) => {
			const review = await db.courseReview.findUnique({ where: { id: input.reviewId }, select: { id: true, courseId: true } });
			if (!review) throw new ORPCError("NOT_FOUND");
			await requireCourseAccess(review.courseId, context.user.id);
			try {
				await db.reviewReport.create({ data: { reviewId: input.reviewId, userId: context.user.id, reason: input.reason.trim() } });
			} catch (error) {
				if (!isUniqueConstraintError(error)) throw error;
			}
			return { reported: true };
		}),

	createLessonComment: protectedProcedure
		.route({ method: "POST", path: "/lesson-comments", tags: ["Reviews"], summary: "Create a lesson comment" })
		.input(z.object({ lessonId: z.string().min(1), content: z.string().trim().min(1).max(5000), isAnonymous: z.boolean().default(false) }))
		.handler(async ({ input, context }) => {
			await requireLessonAccess(input.lessonId, context.user.id);
			return db.lessonComment.create({
				data: { lessonId: input.lessonId, userId: context.user.id, content: input.content.trim(), isAnonymous: input.isAnonymous },
			});
		}),

	listLessonComments: protectedProcedure
		.route({ method: "GET", path: "/lesson-comments/{lessonId}", tags: ["Reviews"], summary: "List lesson comments" })
		.input(z.object({ lessonId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			await requireLessonAccess(input.lessonId, context.user.id);
			const comments = await db.lessonComment.findMany({
				where: { lessonId: input.lessonId, deletedAt: null },
				orderBy: { createdAt: "asc" },
				include: { user: { select: { name: true } } },
			});
			return { comments: comments.map((comment) => serializeLessonCommentForViewer(comment, "learner")) };
		}),

	operatorList: reviewOperatorProcedure
		.route({ method: "GET", path: "/review-admin", tags: ["Reviews"], summary: "List review and comment moderation data" })
		.handler(async () => {
			const [reviews, comments, reports] = await Promise.all([
				db.courseReview.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } }, reports: true } }),
				db.lessonComment.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } }),
				db.reviewReport.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } }, review: { select: { id: true, courseId: true, content: true } } } }),
			]);
			return {
				reviews,
				comments: comments.map((comment) => serializeLessonCommentForViewer(comment, "operator")),
				reports,
			};
		}),

	operatorHideReview: reviewOperatorProcedure
		.input(z.object({ reviewId: z.string().min(1), isVisible: z.boolean() }))
		.handler(async ({ input }) => db.courseReview.update({ where: { id: input.reviewId }, data: { isVisible: input.isVisible } })),

	operatorReplyReview: reviewOperatorProcedure
		.input(z.object({ reviewId: z.string().min(1), replyContent: z.string().trim().min(1).max(5000) }))
		.handler(async ({ input }) => db.courseReview.update({ where: { id: input.reviewId }, data: { replyContent: input.replyContent.trim(), replyAt: new Date() } })),

	operatorMarkCommentRead: reviewOperatorProcedure
		.input(z.object({ commentId: z.string().min(1) }))
		.handler(async ({ input }) => db.lessonComment.update({ where: { id: input.commentId }, data: { isRead: true } })),

	operatorDeleteComment: reviewOperatorProcedure
		.input(z.object({ commentId: z.string().min(1) }))
		.handler(async ({ input, context }) => db.lessonComment.update({ where: { id: input.commentId }, data: { deletedAt: new Date(), deletedBy: context.user.id } })),
};
