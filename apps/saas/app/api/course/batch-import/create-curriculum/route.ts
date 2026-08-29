import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";

import { isOperator } from "../../../../../lib/operator";

type LessonInput = {
	title: string;
	content?: string;
	bunnyVideoId?: string;
	duration?: number;
	slug?: string;
};

type ChapterInput = { title: string; lessons: LessonInput[] };

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	if (!isOperator(session.user.email, process.env.ADMIN_EMAIL)) {
		return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
	}

	let body: { courseId?: unknown; confirmed?: unknown; chapters?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
	}
	if (body.confirmed !== true || typeof body.courseId !== "string" || !Array.isArray(body.chapters)) {
		return NextResponse.json({ error: "CONFIRMATION_REQUIRED" }, { status: 400 });
	}

	let chaptersCreated = 0;
	let lessonsCreated = 0;
	const failures: Array<{ chapterTitle: string; lessonTitle: string; error: string }> = [];
	for (const [chapterIndex, chapter] of (body.chapters as ChapterInput[]).entries()) {
		const createdChapter = await db.chapter.create({ data: { courseId: body.courseId, title: chapter.title, order: chapterIndex } });
		chaptersCreated += 1;
		for (const [lessonIndex, lesson] of chapter.lessons.entries()) {
			try {
				await db.lesson.create({
					data: {
						chapterId: createdChapter.id,
						title: lesson.title,
						slug: lesson.slug ?? `${body.courseId}-${chapterIndex + 1}-${lessonIndex + 1}`,
						content: lesson.content ?? "",
						order: lessonIndex,
						videoProvider: lesson.bunnyVideoId ? "BUNNY" : undefined,
						videoUrl: lesson.bunnyVideoId ? `https://iframe.mediadelivery.net/play/${lesson.bunnyVideoId}` : undefined,
						videoDuration: lesson.duration === undefined ? undefined : String(lesson.duration),
					},
				});
				lessonsCreated += 1;
			} catch (error) {
				failures.push({ chapterTitle: chapter.title, lessonTitle: lesson.title, error: error instanceof Error ? error.message : "LESSON_CREATE_FAILED" });
			}
		}
	}

	return NextResponse.json({ chaptersCreated, lessonsCreated, failures }, { status: failures.length ? 207 : 201 });
}
