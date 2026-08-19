import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { parseCourseMdx } from "@startkiter/course/src/mdx/course-mdx";
import { NextResponse } from "next/server";
import { z } from "zod";

import { userHasCourseAccess } from "../../../../lib/course-access";
import {
	appendCompletedBlockId,
	calculateCourseProgress,
} from "@startkiter/api/modules/course/progress";

const progressInputSchema = z
	.object({
		blockId: z.string().min(1).max(80).optional(),
		lessonId: z.string().min(1),
		type: z.enum(["lesson", "block"]),
	})
	.strict()
	.superRefine((value, context) => {
		if (value.type === "block" && !value.blockId) {
			context.addIssue({
				code: "custom",
				message: "blockId is required for block progress.",
				path: ["blockId"],
			});
		}
	});

async function currentProgress(userId: string, courseId: string) {
	const [lessons, progresses] = await Promise.all([
		db.lesson.findMany({
			where: {
				status: "PUBLISHED",
				chapter: { courseId, course: { status: "PUBLISHED" } },
			},
			select: { id: true },
		}),
		db.lessonProgress.findMany({
			where: {
				userId,
				completedAt: { not: null },
				lesson: {
					status: "PUBLISHED",
					chapter: { courseId, course: { status: "PUBLISHED" } },
				},
			},
			select: { lessonId: true },
		}),
	]);

	return calculateCourseProgress({
		completedLessonIds: progresses.map((progress) => progress.lessonId),
		publishedLessonIds: lessons.map((lesson) => lesson.id),
	});
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
	}
	if (!(await userHasCourseAccess(session.user.id))) {
		return NextResponse.json({ error: "course_access_denied" }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}
	const input = progressInputSchema.safeParse(body);
	if (!input.success) {
		return NextResponse.json({ error: "invalid_progress_event" }, { status: 400 });
	}

	const lesson = await db.lesson.findUnique({
		where: { id: input.data.lessonId },
		select: {
			content: true,
			id: true,
			status: true,
			chapter: { select: { courseId: true, course: { select: { status: true } } } },
		},
	});
	if (!lesson || lesson.status !== "PUBLISHED" || lesson.chapter.course.status !== "PUBLISHED") {
		return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
	}

	if (input.data.type === "lesson") {
		await db.lessonProgress.upsert({
			where: {
				userId_lessonId: {
					lessonId: lesson.id,
					userId: session.user.id,
				},
			},
			create: {
				completedAt: new Date(),
				lessonId: lesson.id,
				userId: session.user.id,
			},
			update: { completedAt: new Date() },
		});
	} else {
		const parsedContent = parseCourseMdx(lesson.content);
		if (!parsedContent.ok || !parsedContent.blocks.some((block) => block.id === input.data.blockId)) {
			return NextResponse.json({ error: "unregistered_block" }, { status: 400 });
		}
		await appendCompletedBlockId(db.lessonProgress, {
			blockId: input.data.blockId!,
			lessonId: lesson.id,
			userId: session.user.id,
		});
	}

	return NextResponse.json({
		progress: await currentProgress(session.user.id, lesson.chapter.courseId),
	});
}
