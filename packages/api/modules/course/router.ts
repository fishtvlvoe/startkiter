import { ORPCError } from "@orpc/server";
import { db, VideoProvider } from "@startkiter/database";
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure } from "../../orpc/procedures";
import { resolveVideoSource } from "./lib/video-resolver";

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
	getLessonDetail: publicProcedure
		.input(z.object({ lessonId: z.string() }))
		.handler(async ({ input, context }) => {
			const lesson = await db.lesson.findUnique({
				where: { id: input.lessonId },
				include: { chapter: true },
			});

			if (!lesson || lesson.status !== "PUBLISHED") {
				throw new ORPCError("NOT_FOUND");
			}

			// 若非免費試看，必須驗證已登入且具備權限
			if (!lesson.isFreePreview) {
				// @ts-expect-error optional user in context
				const userId = context?.user?.id;
				if (!userId) {
					throw new ORPCError("UNAUTHORIZED");
				}

				const order = await db.order.findFirst({
					where: {
						userId,
						courseAccess: true,
						status: "paid",
					},
				});

				if (!order) {
					throw new ORPCError("FORBIDDEN");
				}
			}

			return { lesson };
		}),

	// 4. 切換/標記單元完成 (Protected)
	toggleLessonProgress: protectedProcedure
		.input(z.object({ lessonId: z.string() }))
		.handler(async ({ input, context }) => {
			const existing = await db.lessonProgress.findUnique({
				where: {
					userId_lessonId: {
						userId: context.user.id,
						lessonId: input.lessonId,
					},
				},
			});

			if (existing) {
				await db.lessonProgress.delete({
					where: { id: existing.id },
				});
				return { completed: false };
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
	getStudioData: adminProcedure.handler(async () => {
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
	updateLesson: adminProcedure
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
			const { id, ...data } = input;
			let videoProvider: VideoProvider | undefined = undefined;

			if (data.videoUrl) {
				const resolved = resolveVideoSource(data.videoUrl);
				if (resolved.ok) {
					videoProvider = resolved.provider as VideoProvider;
				}
			}

			const updated = await db.lesson.update({
				where: { id },
				data: {
					...data,
					...(videoProvider ? { videoProvider } : {}),
				},
			});

			return { lesson: updated };
		}),
});

