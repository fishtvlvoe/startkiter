import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@startkiter/auth";
import { canManageCourse } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { isOperator } from "@startkiter/permissions";
import { db } from "@startkiter/database";
import { checkLessonToolUrl } from "@startkiter/platform/src/lesson-tool/url-safety";

const bodySchema = z.object({
	lessonId: z.string().trim().min(1),
	toolUrl: z.string(),
	toolTitle: z.string(),
});

export async function PATCH(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}

	let json: unknown;
	try {
		json = await request.json();
	} catch {
		return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
	}

	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
	}

	const { lessonId, toolUrl, toolTitle } = parsed.data;

	const lesson = await db.lesson.findUnique({
		where: { id: lessonId },
		select: {
			id: true,
			chapter: { select: { courseId: true } },
		},
	});
	if (!lesson) {
		return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
	}

	const allowed = await canManageCourse({
		userId: session.user.id,
		courseId: lesson.chapter.courseId,
		isOperator: isOperator(session.user, process.env.ADMIN_EMAIL),
	});
	if (!allowed) {
		return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
	}

	const normalizedUrl = toolUrl.trim() || null;
	const normalizedTitle = toolTitle.trim() || null;

	if (normalizedUrl) {
		const check = await checkLessonToolUrl(normalizedUrl);
		if (!check.ok) {
			return NextResponse.json({ error: check.code }, { status: 400 });
		}
	}

	const updated = await db.lesson.update({
		where: { id: lessonId },
		data: {
			toolUrl: normalizedUrl,
			toolTitle: normalizedTitle,
		},
		select: {
			toolUrl: true,
			toolTitle: true,
		},
	});

	return NextResponse.json(updated);
}
