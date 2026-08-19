import { auth } from "@startkiter/auth";
import { resolveVideoSource } from "@startkiter/course/video-resolver";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";

import { userHasCourseAccess } from "../../../../lib/course-access";
import { readPublishedCourseCatalogFromDatabase } from "@startkiter/api/modules/course/catalog-reader";

export async function GET(request: Request) {
	const course = await db.course.findFirst({
			where: { status: "PUBLISHED" },
			orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
			select: { description: true, id: true, slug: true, title: true },
	});
	const chapters = course ? await readPublishedCourseCatalogFromDatabase(course.id) : [];
	return NextResponse.json({
		course,
		chapters,
		lessons: chapters.flatMap((chapter) => chapter.lessons),
	});
}

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}

	const lessonId =
		typeof body === "object" && body !== null && "lessonId" in body && typeof body.lessonId === "string"
			? body.lessonId.trim()
			: "";
	if (!lessonId) {
		return NextResponse.json({ error: "lesson_id_required" }, { status: 400 });
	}

	const lesson = await db.lesson.findFirst({
		where: {
			OR: [{ id: lessonId }, { slug: lessonId }],
			status: "PUBLISHED",
			chapter: { course: { status: "PUBLISHED" } },
		},
		select: {
			content: true,
			id: true,
			isFreePreview: true,
			title: true,
			videoDuration: true,
			videoUrl: true,
		},
	});
	if (!lesson) {
		return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
	}

	const session = await auth.api.getSession({ headers: request.headers });
	const entitled = session ? await userHasCourseAccess(session.user.id) : false;
	if (!lesson.isFreePreview && !entitled) {
		return NextResponse.json(
			{ error: session ? "course_access_denied" : "authentication_required" },
			{ status: session ? 403 : 401 },
		);
	}

	const videoSource = lesson.videoUrl ? resolveVideoSource(lesson.videoUrl) : null;
	if (!videoSource?.ok) {
		return NextResponse.json({ error: "lesson_media_unavailable" }, { status: 404 });
	}

	return NextResponse.json({
		lesson: {
			content: lesson.content,
			id: lesson.id,
			isFreePreview: lesson.isFreePreview,
			title: lesson.title,
			videoDuration: lesson.videoDuration,
			videoSource,
		},
	});
}
