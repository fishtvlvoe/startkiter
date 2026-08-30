import { createOpenAI } from "@ai-sdk/openai";
import { canManageCourse } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { isOperator } from "@startkiter/permissions";
import { readGeminiApiKey } from "@startkiter/api/modules/course/lib/gemini-settings";
import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { checkRateLimit, srtToText } from "@startkiter/platform";
import { streamText } from "../../../../../../../packages/ai";
import { NextResponse } from "next/server";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonError(error: string, status: number, extra: Record<string, unknown> = {}) {
	return NextResponse.json({ error, ...extra }, { status });
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return jsonError("UNAUTHORIZED", 401);
	}

	let body: Record<string, unknown>;
	try {
		const parsed: unknown = await request.json();
		if (!isPlainObject(parsed)) {
			return jsonError("INVALID_BODY", 400);
		}
		body = parsed;
	} catch {
		return jsonError("INVALID_BODY", 400);
	}

	const lessonId = body.lessonId;
	const courseId = body.courseId;
	const chapterTitle = body.chapterTitle;
	const lessonTitle = body.lessonTitle;
	const srtContent = body.srtContent;
	if (
		(lessonId !== undefined && typeof lessonId !== "string") ||
		(lessonId === undefined && typeof courseId !== "string") ||
		typeof chapterTitle !== "string" ||
		typeof lessonTitle !== "string" ||
		typeof srtContent !== "string" ||
		!srtContent.trim()
	) {
		return jsonError("INVALID_BODY", 400);
	}

	const lesson = typeof lessonId === "string" ? await db.lesson.findUnique({
		where: { id: lessonId },
		include: { chapter: true },
	}) : null;
	if (lessonId !== undefined && !lesson) {
		return jsonError("NOT_FOUND", 404);
	}

	const managedCourseId = lesson?.chapter.courseId ?? courseId;
	const allowed = await canManageCourse({
		userId: session.user.id,
		courseId: managedCourseId as string,
		isOperator: isOperator(session.user, process.env.ADMIN_EMAIL),
	});
	if (!allowed) {
		return jsonError("FORBIDDEN", 403);
	}

	const apiKey = await readGeminiApiKey(session.user.id);
	if (!apiKey) {
		return jsonError("GEMINI_KEY_MISSING", 400);
	}

	const rateLimit = checkRateLimit(session.user.id);
	if (!rateLimit.allowed) {
		return jsonError("RATE_LIMITED", 429, { retryAfterMs: rateLimit.retryAfterMs });
	}

	const gemini = createOpenAI({
		apiKey,
		baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
		name: "gemini",
	});
	try {
		const result = streamText({
			model: gemini.chat("gemini-2.5-flash"),
			system: [
				"你是課程講義編輯助手。請只根據字幕內容整理教學講義，不要捏造字幕沒有的事實。",
				"使用多個 Markdown H1 分段，每段結尾加入對應影片時間軸連結，格式為 [MM:SS](#t=秒數)。",
				`章節標題：${chapterTitle}`,
				`單元標題：${lessonTitle}`,
			].join("\n\n"),
			prompt: srtToText(srtContent),
			onError: () => {
				console.error("Gemini 講義生成串流失敗");
			},
		});

		return result.toTextStreamResponse();
	} catch {
		return jsonError("GENERATION_FAILED", 502, { message: "生成失敗：AI provider 無法回應" });
	}
}
