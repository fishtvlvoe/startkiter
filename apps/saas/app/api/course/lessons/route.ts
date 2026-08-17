import { auth } from "@startkiter/auth";
import { decideLessonPlayback, getLesson, listLessons } from "@startkiter/course";
import { NextResponse } from "next/server";

import { userHasCourseAccess } from "../../../../lib/course-access";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
	}

	const entitled = await userHasCourseAccess(session.user.id);
	if (!entitled) {
		return NextResponse.json({ error: "course_access_denied", lessons: [] }, { status: 403 });
	}

	return NextResponse.json({ lessons: listLessons() });
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	let body: { lessonId?: unknown } = {};
	try {
		const parsed = await request.json();
		if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
			body = parsed as { lessonId?: unknown };
		}
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}

	const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
	if (!lessonId) {
		return NextResponse.json({ error: "lesson_id_required" }, { status: 400 });
	}

	const lesson = getLesson(lessonId);

	const entitled = session ? await userHasCourseAccess(session.user.id) : false;
	const decision = decideLessonPlayback({
		sessionPresent: Boolean(session),
		hasCourseAccess: entitled,
		lessonExists: Boolean(lesson),
		lessonId,
	});

	if (decision.status === "unauthorized") {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
	}
	if (decision.status === "forbidden") {
		return NextResponse.json({ error: "course_access_denied" }, { status: 403 });
	}
	if (decision.status === "not_found" || !lesson) {
		return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
	}

	return NextResponse.json({
		id: lesson.id,
		title: lesson.title,
		description: lesson.description,
		mediaUrl: lesson.mediaUrl,
		mediaKind: lesson.mediaKind,
	});
}
