import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";
import { COURSE_STUDIO_ERROR_CODES } from "@startkiter/api/modules/course/errors";
import { isCourseOperator } from "@startkiter/api/modules/course/lib/course-operator";
import { updateLesson } from "@startkiter/api/modules/course/lib/update-lesson";
import type { OperatorSession } from "../../../../lib/operator";

function getOperatorStatus(session: OperatorSession) {
	if (!session?.user?.id) {
		return 401;
	}
	return isCourseOperator(session.user.email, process.env.ADMIN_EMAIL) ? null : 403;
}

function generateSlug(prefix: string) {
	const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	return `${prefix}-${suffix}`;
}

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = getOperatorStatus(session);
	if (status === 401) {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.UNAUTHORIZED }, { status: 401 });
	}
	if (status === 403) {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.FORBIDDEN }, { status: 403 });
	}

	const userId = session?.user.id;
	if (!userId) {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.UNAUTHORIZED }, { status: 401 });
	}

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
	});

	const collapseStates = await db.studioFolderCollapseState.findMany({
		where: { userId },
	});

	const collapseByFolderId = new Map(collapseStates.map((s) => [s.folderId, s.isCollapsed]));

	const foldersWithUserCollapse = folders.map((f) => ({
		...f,
		isCollapsed: collapseByFolderId.has(f.id) ? collapseByFolderId.get(f.id)! : f.isCollapsed,
	}));

	return NextResponse.json({ courses, folders: foldersWithUserCollapse });
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = getOperatorStatus(session);
	if (status === 401) {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.UNAUTHORIZED }, { status: 401 });
	}
	if (status === 403) {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.FORBIDDEN }, { status: 403 });
	}

	const userId = session?.user.id;
	if (!userId) {
		return NextResponse.json({ error: COURSE_STUDIO_ERROR_CODES.UNAUTHORIZED }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action, payload } = body;

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
