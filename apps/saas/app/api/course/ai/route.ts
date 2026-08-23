import { generateText, textModel } from "../../../../../../packages/ai";
import { auth } from "@startkiter/auth";
import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";

function unavailable() {
	return NextResponse.json(
		{
			error: "ai_unavailable",
			message: "AI 助教目前無法使用",
		},
		{ status: 503 },
	);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
	try {
		if (!process.env.OPENAI_API_KEY?.trim()) {
			return unavailable();
		}

		let body: Record<string, unknown> = {};

		try {
			const parsed: unknown = await request.json();

			if (!isPlainObject(parsed)) {
				return NextResponse.json(
					{ error: "invalid_body", message: "提問格式不正確" },
					{ status: 400 },
				);
			}

			body = parsed;
		} catch {
			return NextResponse.json(
				{ error: "invalid_body", message: "提問格式不正確" },
				{ status: 400 },
			);
		}

		const lessonId = body.lessonId;
		const question = body.question;

		if (typeof lessonId !== "string" || typeof question !== "string" || !question.trim()) {
			return NextResponse.json(
				{ error: "invalid_body", message: "提問格式不正確" },
				{ status: 400 },
			);
		}

		const lesson = await db.lesson.findUnique({
			where: { id: lessonId },
			include: { chapter: true },
		});

		if (!lesson || lesson.status !== "PUBLISHED") {
			return NextResponse.json(
				{ error: "not_found", message: "找不到這個單元" },
				{ status: 404 },
			);
		}

		const session = await auth.api.getSession({ headers: request.headers });

		if (!lesson.isFreePreview) {
			if (!session) {
				return NextResponse.json(
					{ error: "unauthorized", message: "請先登入再使用 AI 助教" },
					{ status: 401 },
				);
			}

			const allowed = await userCanAccessCourseId(session.user.id, lesson.chapter.courseId);
			if (!allowed) {
				return NextResponse.json(
					{ error: "forbidden", message: "沒有觀看這個單元的權限" },
					{ status: 403 },
				);
			}
		}

		const { text } = await generateText({
			model: textModel,
			prompt: [
				"你是這門課的隨課助教。只能根據下方「目前授權單元」的講義與助教脈絡回答。",
				"不可以推測或引用其他單元、其他學員資料，也不可以呼叫任何外部工具。",
				`單元標題：${lesson.title}`,
				`講義：\n${lesson.content ?? ""}`,
				`助教脈絡：\n${lesson.aiContext ?? ""}`,
				`學員提問：\n${question.trim()}`,
			].join("\n\n"),
		});

		return NextResponse.json({ text });
	} catch {
		return unavailable();
	}
}
