import { ORPCError } from "@orpc/server";
import { extractLessonBlockIds } from "../../../course/src/mdx/extract-lesson-block-ids";
import { db, VideoProvider } from "@startkiter/database";
import { z } from "zod";
import {
	adminProcedure,
	protectedProcedure,
	publicProcedure,
	publicProcedureWithSession,
} from "../../orpc/procedures";
import { isCourseOperator } from "./lib/course-operator";
import { userCanAccessCourseId } from "./lib/course-access";
import { updateLesson } from "./lib/update-lesson";
import { resolveVideoSource } from "./lib/video-resolver";
import { cancelCourseSubscription } from "./procedures/cancel-course-subscription";
import { createSubscriptionCheckout } from "./procedures/create-subscription-checkout";
import { issueInvoiceAllowance, voidInvoice } from "./procedures/invoice-operations";

const courseOperatorProcedure = protectedProcedure.use(async ({ context, next }) => {
	if (!isCourseOperator(context.user.email, process.env.ADMIN_EMAIL)) {
		throw new ORPCError("FORBIDDEN");
	}

	return await next();
});

export const courseRouter = publicProcedure.router({
	// 1. 公開/試看課綱大綱 (Public)
	getPublicCurriculum: publicProcedure.handler(async () => {
		const course = await db.course.findFirst({
			where: { status: "PUBLISHED" },
			include: {
				chapters: {
					orderBy: { order: "asc" },
					include: {
						lessons: {
							where: { status: "PUBLISHED" },
							orderBy: { order: "asc" },
							select: {
								id: true,
								slug: true,
								title: true,
								isFreePreview: true,
								videoDuration: true,
								order: true,
								chapterId: true,
							},
						},
					},
				},
			},
		});

		return { course };
	}),

	// 2. 學員教室課綱與個人進度 (Protected)
	getLearnerCurriculum: protectedProcedure.handler(async ({ context }) => {
		const course = await db.course.findFirst({
			where: { status: "PUBLISHED" },
			include: {
				chapters: {
					orderBy: { order: "asc" },
					include: {
						lessons: {
							where: { status: "PUBLISHED" },
							orderBy: { order: "asc" },
							select: {
								id: true,
								slug: true,
								title: true,
								isFreePreview: true,
								videoDuration: true,
								order: true,
								chapterId: true,
							},
						},
					},
				},
			},
		});

		if (!course) {
			return {
				course: null,
				progress: { completedCount: 0, totalCount: 0, percentage: 0, completedLessonIds: [] as string[] },
			};
		}

		// 計算進度
		const allPublishedLessons = course.chapters.flatMap((c: { lessons: Array<{ id: string }> }) => c.lessons);
		const totalCount = allPublishedLessons.length;

		const userProgresses = await db.lessonProgress.findMany({
			where: {
				userId: context.user.id,
				lesson: { status: "PUBLISHED" },
			},
			select: { lessonId: true },
		});

		const completedLessonIds = userProgresses.map((p: { lessonId: string }) => p.lessonId);
		const completedCount = completedLessonIds.length;
		const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

		return {
			course,
			progress: {
				completedCount,
				totalCount,
				percentage,
				completedLessonIds,
			},
		};
	}),

	// 3. 取得單元詳情與媒體內容 (Protected / Public preview)
	getLessonDetail: publicProcedureWithSession
		.input(z.object({ lessonId: z.string() }))
		.handler(async ({ input, context: { user } }) => {
			const lesson = await db.lesson.findUnique({
				where: { id: input.lessonId },
				include: { chapter: true },
			});

			if (!lesson || lesson.status !== "PUBLISHED") {
				throw new ORPCError("NOT_FOUND");
			}

			// 若非免費試看，必須驗證已登入且具備權限
			if (!lesson.isFreePreview) {
				if (!user?.id) {
					throw new ORPCError("UNAUTHORIZED");
				}

				const allowed = await userCanAccessCourseId(user.id, lesson.chapter.courseId);
				if (!allowed) {
					throw new ORPCError("FORBIDDEN");
				}
			}

			return { lesson };
		}),

	// 4. 積木完成事件寫入單元進度 (Protected, idempotent)
	toggleLessonProgress: protectedProcedure
		.input(
			z.object({
				lessonId: z.string(),
				blockId: z.string().min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			const lesson = await db.lesson.findUnique({
				where: { id: input.lessonId },
				select: { id: true, content: true },
			});

			if (!lesson) {
				throw new ORPCError("NOT_FOUND", { message: "找不到這個單元。" });
			}

			const allowedBlockIds = extractLessonBlockIds(lesson.content ?? "");

			if (!allowedBlockIds.includes(input.blockId)) {
				throw new ORPCError("FORBIDDEN", {
					message: "這個積木不屬於目前單元，完成事件已被拒絕。",
				});
			}

			const existing = await db.lessonProgress.findUnique({
				where: {
					userId_lessonId: {
						userId: context.user.id,
						lessonId: input.lessonId,
					},
				},
			});

			if (existing) {
				return { completed: true };
			}

			await db.lessonProgress.create({
				data: {
					userId: context.user.id,
					lessonId: input.lessonId,
				},
			});

			return { completed: true };
		}),

	// 5. 智慧影音來源解析 (Admin)
	resolveVideo: adminProcedure
		.input(z.object({ videoUrl: z.string() }))
		.handler(async ({ input }) => {
			const result = resolveVideoSource(input.videoUrl);
			if (!result.ok) {
				throw new ORPCError("BAD_REQUEST", { message: result.error });
			}
			return result;
		}),

	// 6. Course Studio 總數據 (Admin)
	getStudioData: courseOperatorProcedure.handler(async () => {
		const courses = await db.course.findMany({
			include: {
				chapters: {
					orderBy: { order: "asc" },
					include: {
						lessons: {
							orderBy: { order: "asc" },
						},
					},
				},
			},
		});

		const folders = await db.studioFolder.findMany({
			orderBy: { order: "asc" },
			include: {
				items: {
					orderBy: { order: "asc" },
				},
			},
		});

		return { courses, folders };
	}),

	// 7. 更新單元 (Admin)
	updateLesson: courseOperatorProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				isFreePreview: z.boolean().optional(),
				videoUrl: z.string().optional(),
				videoDuration: z.string().optional(),
				content: z.string().optional(),
				aiPrompt: z.string().optional(),
				aiContext: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const result = await updateLesson(input);
			if (!result.ok) {
				throw new ORPCError("BAD_REQUEST", {
					message: result.details,
					data: { code: result.error, details: result.details },
				});
			}

			return { lesson: result.lesson };
		}),

	createSubscriptionCheckout,
	cancelCourseSubscription,
	voidInvoice,
	issueInvoiceAllowance,
});
