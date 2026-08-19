import { ORPCError } from "@orpc/server";
import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { canAccessCourse } from "@startkiter/course";
import { parseCourseMdx } from "@startkiter/course/src/mdx/course-mdx";
import { z } from "zod";

import { adminProcedure, protectedProcedure, publicProcedure } from "../../orpc/procedures";
import { readPublishedCourseCatalogFromDatabase } from "./catalog-reader";
import { resolveVideoSource } from "./lib/video-resolver";
import { appendCompletedBlockId, calculateCourseProgress } from "./progress";
import {
	executeStudioCommand,
	getStudioSnapshot,
	studioCommandSchema,
} from "./studio-service";

async function hasCourseAccess(userId: string) {
	return canAccessCourse(userId, {
		findOrdersForUser: (id) =>
			db.order.findMany({
				where: { userId: id },
				select: { courseAccess: true, sku: true },
			}),
	});
}

async function publishedLessonIds(courseId: string) {
	const lessons = await db.lesson.findMany({
		where: {
			status: "PUBLISHED",
			chapter: { courseId, course: { status: "PUBLISHED" } },
		},
		select: { id: true },
	});
	return lessons.map((lesson) => lesson.id);
}

async function requireEntitledPublishedLesson(userId: string, lessonId: string) {
	if (!(await hasCourseAccess(userId))) {
		throw new ORPCError("FORBIDDEN");
	}
	const lesson = await db.lesson.findUnique({
		where: { id: lessonId },
		select: {
			content: true,
			id: true,
			status: true,
			chapter: { select: { courseId: true, course: { select: { status: true } } } },
		},
	});
	if (!lesson || lesson.status !== "PUBLISHED" || lesson.chapter.course.status !== "PUBLISHED") {
		throw new ORPCError("NOT_FOUND");
	}
	return lesson;
}

export const courseRouter = publicProcedure.router({
	getPublicCurriculum: publicProcedure.handler(async () => {
		const course = await db.course.findFirst({
			where: { status: "PUBLISHED" },
			orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
			select: { description: true, id: true, publishedAt: true, slug: true, title: true },
		});
		const chapters = course ? await readPublishedCourseCatalogFromDatabase(course.id) : [];
		return { course: course ? { ...course, chapters } : null };
	}),

	getLearnerCurriculum: protectedProcedure.handler(async ({ context }) => {
		const course = await db.course.findFirst({
			where: { status: "PUBLISHED" },
			orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
			include: {
				chapters: {
					orderBy: [{ order: "asc" }, { id: "asc" }],
					include: {
						lessons: {
							where: { status: "PUBLISHED" },
							orderBy: [{ order: "asc" }, { id: "asc" }],
							select: {
								id: true,
								isFreePreview: true,
								slug: true,
								title: true,
								videoDuration: true,
							},
						},
					},
				},
			},
		});
		const completedProgresses = course
			? await db.lessonProgress.findMany({
					where: {
						userId: context.user.id,
						completedAt: { not: null },
						lesson: {
							status: "PUBLISHED",
							chapter: {
								courseId: course.id,
								course: { status: "PUBLISHED" },
							},
						},
					},
					select: { lessonId: true },
				})
			: [];
		const ids = course?.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id)) ?? [];
		return {
			course,
			progress: calculateCourseProgress({
				completedLessonIds: completedProgresses.map((progress) => progress.lessonId),
				publishedLessonIds: ids,
			}),
		};
	}),

	getLessonDetail: publicProcedure
		.input(z.object({ lessonId: z.string().min(1) }).strict())
		.handler(async ({ context, input }) => {
			const lesson = await db.lesson.findFirst({
				where: {
					OR: [{ id: input.lessonId }, { slug: input.lessonId }],
					status: "PUBLISHED",
					chapter: { course: { status: "PUBLISHED" } },
				},
				include: { chapter: true },
			});
			if (!lesson) {
				throw new ORPCError("NOT_FOUND");
			}
			const videoSource = lesson.videoUrl ? resolveVideoSource(lesson.videoUrl) : null;
			if (!videoSource?.ok) {
				throw new ORPCError("NOT_FOUND");
			}
			const responseLesson = {
				content: lesson.content,
				id: lesson.id,
				isFreePreview: lesson.isFreePreview,
				title: lesson.title,
				videoDuration: lesson.videoDuration,
				videoSource,
			};
			if (lesson.isFreePreview) {
				return { lesson: responseLesson };
			}

			const session = await auth.api.getSession({ headers: context.headers });
			if (!session) {
				throw new ORPCError("UNAUTHORIZED");
			}
			if (!(await hasCourseAccess(session.user.id))) {
				throw new ORPCError("FORBIDDEN");
			}
			return { lesson: responseLesson };
		}),

	completeLesson: protectedProcedure
		.input(z.object({ lessonId: z.string().min(1) }).strict())
		.handler(async ({ context, input }) => {
			const lesson = await requireEntitledPublishedLesson(context.user.id, input.lessonId);
			await db.lessonProgress.upsert({
				where: {
					userId_lessonId: {
						lessonId: lesson.id,
						userId: context.user.id,
					},
				},
				create: {
					completedAt: new Date(),
					lessonId: lesson.id,
					userId: context.user.id,
				},
				update: { completedAt: new Date() },
			});
			const completed = await db.lessonProgress.findMany({
				where: { userId: context.user.id, completedAt: { not: null } },
				select: { lessonId: true },
			});
			return {
				progress: calculateCourseProgress({
					completedLessonIds: completed.map((progress) => progress.lessonId),
					publishedLessonIds: await publishedLessonIds(lesson.chapter.courseId),
				}),
			};
		}),

	recordBlockCompletion: protectedProcedure
		.input(z.object({ blockId: z.string().min(1).max(80), lessonId: z.string().min(1) }).strict())
		.handler(async ({ context, input }) => {
			const lesson = await requireEntitledPublishedLesson(context.user.id, input.lessonId);
			const content = parseCourseMdx(lesson.content);
			if (!content.ok || !content.blocks.some((block) => block.id === input.blockId)) {
				throw new ORPCError("BAD_REQUEST");
			}
			await appendCompletedBlockId(db.lessonProgress, {
				blockId: input.blockId,
				lessonId: lesson.id,
				userId: context.user.id,
			});
			return { accepted: true };
		}),

	// Retained temporarily for old clients. Completion is now idempotent and never
	// clears a persisted record, so repeated requests cannot lower the total.
	toggleLessonProgress: protectedProcedure
		.input(z.object({ lessonId: z.string().min(1) }).strict())
		.handler(async ({ context, input }) => {
			const lesson = await requireEntitledPublishedLesson(context.user.id, input.lessonId);
			await db.lessonProgress.upsert({
				where: {
					userId_lessonId: {
						lessonId: lesson.id,
						userId: context.user.id,
					},
				},
				create: {
					completedAt: new Date(),
					lessonId: lesson.id,
					userId: context.user.id,
				},
				update: { completedAt: new Date() },
			});
			return { completed: true };
		}),

	resolveVideo: adminProcedure
		.input(z.object({ videoUrl: z.string().trim().min(1) }).strict())
		.handler(async ({ input }) => {
			const result = resolveVideoSource(input.videoUrl);
			if (!result.ok) {
				throw new ORPCError("BAD_REQUEST", { message: result.error });
			}
			return result;
		}),

	getStudioData: adminProcedure.handler(async ({ context }) => getStudioSnapshot(context.user.id)),

	studioCommand: adminProcedure
		.input(studioCommandSchema)
		.handler(async ({ context, input }) => ({
			result: await executeStudioCommand(input, context.user.id),
		})),

	updateLesson: adminProcedure
		.input(
			z
				.object({
					aiContext: z.string().trim().max(20_000).nullable().optional(),
					content: z.string().trim().max(20_000).nullable().optional(),
					id: z.string().min(1),
					isFreePreview: z.boolean().optional(),
					status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
					title: z.string().trim().min(1).max(160).optional(),
					videoDuration: z.string().trim().max(32).nullable().optional(),
					videoUrl: z.string().trim().max(2_000).nullable().optional(),
				})
				.strict(),
		)
		.handler(async ({ context, input }) => ({
			lesson: await executeStudioCommand({ action: "updateLesson", ...input }, context.user.id),
		})),
});
