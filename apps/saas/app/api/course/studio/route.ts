import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { getClientIp, recordAdminAction } from "@startkiter/platform";
import { isOperator, type OperatorSession } from "@startkiter/permissions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { COURSE_STUDIO_ERROR_CODES } from "@startkiter/api/modules/course/errors";
import { canManageCourse } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { updateLesson } from "@startkiter/api/modules/course/lib/update-lesson";

type StudioAccess = {
	userId: string;
	isOperator: boolean;
};

const watermarkSettingsSchema = z.object({
	courseId: z.string().trim().min(1),
	enabled: z.boolean(),
	showEmail: z.boolean(),
	showCourseTitle: z.boolean(),
	showTimestamp: z.boolean(),
	emailDisplayMode: z.enum(["FULL", "MASKED"]),
	opacityPercent: z.number().int().min(1).max(100),
	textSize: z.enum(["SM", "MD", "LG"]),
	movementMode: z.enum(["STANDARD", "CORNERS"]),
	moveIntervalSec: z.number().int().min(1).max(3600),
	tamperPauseEnabled: z.boolean(),
});

function getAuthenticatedStatus(session: OperatorSession): number | StudioAccess {
	if (!session?.user?.id) {
		return 401;
	}

	return {
		userId: session.user.id,
		isOperator: isOperator(session.user, process.env.ADMIN_EMAIL),
	};
}

function generateSlug(prefix: string) {
	const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	return `${prefix}-${suffix}`;
}

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = getAuthenticatedStatus(session);
	if (typeof status === "number") {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.UNAUTHORIZED }, { status: 401 });
	}
	const { userId, isOperator } = status;

	const courses = await db.course.findMany({
		orderBy: { createdAt: "desc" },
		...(isOperator ? {} : { where: { instructors: { some: { userId } } } }),
		include: {
			watermarkSetting: true,
			chapters: {
				orderBy: { order: "asc" },
				include: {
					lessons: {
						orderBy: { order: "asc" },
					},
				},
			},
			...(isOperator
				? {
						instructors: {
							include: { user: { select: { id: true, name: true, email: true } } },
						},
					}
				: {}),
		},
	});

	const folders = await db.studioFolder.findMany({
		orderBy: { order: "asc" },
	});

	const collapseStates = await db.studioFolderCollapseState.findMany({
		where: { userId },
	});

	const collapseByFolderId = new Map(collapseStates.map((s) => [s.folderId, s.isCollapsed]));

	const foldersWithUserCollapse = folders.map((f) => ({
		...f,
		isCollapsed: collapseByFolderId.has(f.id) ? collapseByFolderId.get(f.id)! : f.isCollapsed,
	}));

	return NextResponse.json({ courses, folders: foldersWithUserCollapse, isOperator });
}

async function getCourseIdsForAction(
	action: string,
	payload: Record<string, any>,
): Promise<string[] | null> {
	if (action === "create_chapter") {
		const courseId = payload.courseId;
		return typeof courseId === "string" && courseId.length > 0 ? [courseId] : null;
	}

	if (action === "update_watermark") {
		const courseId = payload.courseId;
		return typeof courseId === "string" && courseId.length > 0 ? [courseId] : null;
	}

	if (action === "update_course" || action === "delete_course" || action === "publish_course") {
		const courseId = payload.id;
		return typeof courseId === "string" && courseId.length > 0 ? [courseId] : null;
	}

	if (action === "update_chapter" || action === "delete_chapter") {
		const chapter = await db.chapter.findUnique({
			where: { id: payload.id },
			select: { courseId: true },
		});
		return chapter ? [chapter.courseId] : null;
	}

	if (action === "create_lesson") {
		const chapter = await db.chapter.findUnique({
			where: { id: payload.chapterId },
			select: { courseId: true },
		});
		return chapter ? [chapter.courseId] : null;
	}

	if (action === "update_lesson" || action === "delete_lesson") {
		const lesson = await db.lesson.findUnique({
			where: { id: payload.id },
			select: { chapter: { select: { courseId: true } } },
		});
		return lesson ? [lesson.chapter.courseId] : null;
	}

	if (action === "reorder_lessons") {
		const moves = Array.isArray(payload.moves) ? payload.moves : [];
		const lessonIds = moves.map((move: { lessonId: string }) => move.lessonId);
		const chapterIds = moves.map((move: { chapterId: string }) => move.chapterId);
		const [lessons, chapters] = await Promise.all([
			db.lesson.findMany({
				where: { id: { in: lessonIds } },
				select: { chapter: { select: { courseId: true } } },
			}),
			db.chapter.findMany({
				where: { id: { in: chapterIds } },
				select: { courseId: true },
			}),
		]);
		return [...lessons.map((lesson) => lesson.chapter.courseId), ...chapters.map((chapter) => chapter.courseId)];
	}

	return [];
}

async function isAllowedForCourseAction(
	access: StudioAccess,
	action: string,
	payload: Record<string, any>,
): Promise<boolean> {
	if (access.isOperator) return true;
	if (["create_course", "create_folder", "delete_folder", "update_watermark"].includes(action)) return false;
	if (action === "update_folder") return payload.name === undefined;

	const courseIds = await getCourseIdsForAction(action, payload);
	if (!courseIds || courseIds.length === 0) return false;

	const uniqueCourseIds = [...new Set(courseIds)];
	const results = await Promise.all(
		uniqueCourseIds.map((courseId) =>
			canManageCourse({ userId: access.userId, courseId, isOperator: access.isOperator }),
		),
	);
	return results.every(Boolean);
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = getAuthenticatedStatus(session);
	if (typeof status === "number") {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.UNAUTHORIZED }, { status: 401 });
	}
	const access = status;
	const { userId } = access;

	try {
		const body = await request.json();
		const { action, payload } = body;
		if (!(await isAllowedForCourseAction(access, action, payload ?? {}))) {
			return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.FORBIDDEN }, { status: 403 });
		}

		// 課程 CRUD
		if (action === "create_course") {
			const { title, slug, description } = payload;
			const course = await db.course.create({
				data: {
					slug: slug || generateSlug("course"),
					title,
					description,
					status: "DRAFT",
				},
			});
			return NextResponse.json({ success: true, course });
		}

		if (action === "update_course") {
			const { id, title, description, status: courseStatus } = payload;
			const course = await db.course.update({
				where: { id },
				data: { title, description, status: courseStatus },
			});
			return NextResponse.json({ success: true, course });
		}

		if (action === "delete_course") {
			const { id } = payload;
			await db.course.delete({ where: { id } });
			await recordAdminAction(
				userId,
				"DELETE_COURSE",
				{ type: "Course", id },
				undefined,
				session?.session?.ipAddress ?? getClientIp(request.headers),
			);
			return NextResponse.json({ success: true });
		}

		if (action === "publish_course") {
			const { id } = payload;
			const course = await db.course.update({
				where: { id },
				data: { status: "PUBLISHED" },
			});
			return NextResponse.json({ success: true, course });
		}

		if (action === "update_watermark") {
			const parsed = watermarkSettingsSchema.safeParse(payload);
			if (!parsed.success) {
				return NextResponse.json(
					{ error: COURSE_STUDIO_ERROR_CODES.INVALID_WATERMARK_SETTINGS },
					{ status: 400 },
				);
			}

			const { courseId, ...settings } = parsed.data;
			const watermarkSetting = await db.courseVideoWatermarkSetting.upsert({
				where: { courseId },
				update: settings,
				create: { courseId, ...settings },
			});
			return NextResponse.json({ success: true, watermarkSetting });
		}

		// 章節 CRUD
		if (action === "create_chapter") {
			const { courseId, title, order } = payload;
			const nextOrder =
				order ??
				(await db.chapter.count({ where: { courseId } }));
			const chapter = await db.chapter.create({
				data: { courseId, title, order: nextOrder },
			});
			return NextResponse.json({ success: true, chapter });
		}

		if (action === "update_chapter") {
			const { id, title, order } = payload;
			const chapter = await db.chapter.update({
				where: { id },
				data: { title, order },
			});
			return NextResponse.json({ success: true, chapter });
		}

		if (action === "delete_chapter") {
			const { id } = payload;
			await db.chapter.delete({ where: { id } });
			return NextResponse.json({ success: true });
		}

		// 單元 CRUD
		if (action === "create_lesson") {
			const { chapterId, title, order, isFreePreview } = payload;
			const nextOrder =
				order ??
				(await db.lesson.count({ where: { chapterId } }));
			const lesson = await db.lesson.create({
				data: {
					chapterId,
					slug: generateSlug("lesson"),
					title,
					order: nextOrder,
					isFreePreview: isFreePreview ?? false,
					content: "# 新單元",
				},
			});
			return NextResponse.json({ success: true, lesson });
		}

		if (action === "update_lesson") {
			const { id, title, videoUrl, videoDuration, isFreePreview, content, aiContext } = payload;
			const result = await updateLesson({
				id,
				title,
				videoUrl,
				videoDuration,
				isFreePreview,
				content,
				aiContext,
			});
			if (!result.ok) {
				return NextResponse.json(
					{ error: result.error, details: result.details },
					{ status: 400 },
				);
			}

			return NextResponse.json({ success: true, lesson: result.lesson });
		}

		if (action === "delete_lesson") {
			const { id } = payload;
			await db.lesson.delete({ where: { id } });
			await recordAdminAction(
				userId,
				"DELETE_LESSON",
				{ type: "Lesson", id },
				undefined,
				session?.session?.ipAddress ?? getClientIp(request.headers),
			);
			return NextResponse.json({ success: true });
		}

		// 跨章節排序（使用 transaction 保證一致性）
		if (action === "reorder_lessons") {
			const { moves } = payload as {
				moves: Array<{ lessonId: string; chapterId: string; order: number }>;
			};
			await db.$transaction(
				moves.map((m) =>
					db.lesson.update({
						where: { id: m.lessonId },
						data: { chapterId: m.chapterId, order: m.order },
					}),
				),
			);
			return NextResponse.json({ success: true });
		}

		// 資料夾 CRUD 與收折狀態（每個 operator 獨立）
		if (action === "create_folder") {
			const { name, order } = payload;
			const nextOrder = order ?? ((await db.studioFolder.count()) + 1);
			const folder = await db.studioFolder.create({
				data: { name, order: nextOrder },
			});
			return NextResponse.json({ success: true, folder });
		}

		if (action === "update_folder") {
			const { id, name, isCollapsed } = payload;

			// 資料夾名稱變更屬於全站資料，直接更新 StudioFolder
			if (name !== undefined) {
				await db.studioFolder.update({
					where: { id },
					data: { name },
				});
			}

			// 收折狀態屬於個人偏好，寫入 StudioFolderCollapseState，避免全體 operator 共用
			if (isCollapsed !== undefined) {
				await db.studioFolderCollapseState.upsert({
					where: {
						userId_folderId: {
							userId,
							folderId: id,
						},
					},
					update: { isCollapsed },
					create: { userId, folderId: id, isCollapsed },
				});
			}

			const folder = await db.studioFolder.findUnique({ where: { id } });
			return NextResponse.json({ success: true, folder });
		}

		if (action === "delete_folder") {
			const { id } = payload;
			await db.studioFolder.delete({ where: { id } });
			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.UNKNOWN_ACTION }, { status: 400 });
	} catch (error) {
		return NextResponse.json(
			{ error: COURSE_STUDIO_ERROR_CODES.INTERNAL_ERROR, details: String(error) },
			{ status: 500 },
		);
	}
}
