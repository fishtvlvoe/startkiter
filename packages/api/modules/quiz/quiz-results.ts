import { ORPCError } from "@orpc/server";
import { getQuizDefinition, quizDefinitionBodySchema } from "@startkiter/course-quiz";
import { db } from "@startkiter/database";

import { requireCourseManageAccess } from "../course/lib/course-instructor-access";

export type QuizAttemptSummary = {
	userId: string;
	userName: string;
	userEmail: string;
	attemptCount: number;
	latestAttemptId: string;
	score: number;
	passed: boolean;
	submittedAt: Date;
	timeTakenSeconds: number | null;
};

export type QuizAttemptDetail = {
	id: string;
	lessonId: string;
	userId: string;
	userName: string;
	userEmail: string;
	score: number;
	passed: boolean;
	submittedAt: Date;
	questions: Array<{
		id: string;
		content: string;
		selectedAnswer: unknown;
		correctAnswer: unknown;
		correct: boolean;
	}>;
};

async function getDefinitionForLesson(lessonId: string) {
	const records = await db.pluginContent.findMany({ where: { pluginId: "quiz", type: "quiz-definition" }, orderBy: { createdAt: "asc" } });
	for (const record of records) {
		const parsed = quizDefinitionBodySchema.safeParse(record.body);
		if (parsed.success && parsed.data.lessonId === lessonId) return { ...record, body: parsed.data };
	}
	return null;
}

export async function getQuizAttemptsForAdmin(userId: string, courseId: string, lessonId: string): Promise<QuizAttemptSummary[]> {
	await requireCourseManageAccess(userId, courseId);
	const lesson = await db.lesson.findUnique({
		where: { id: lessonId },
		select: { chapter: { select: { courseId: true } } },
	});
	if (!lesson || lesson.chapter.courseId !== courseId) throw new ORPCError("NOT_FOUND", { message: "找不到指定測驗。" });
	const definition = await getDefinitionForLesson(lessonId);
	if (!definition) throw new ORPCError("NOT_FOUND", { message: "找不到指定測驗。" });

	const attempts = await db.quizAttempt.findMany({
		where: { pluginContentId: definition.id },
		orderBy: { submittedAt: "desc" },
		include: { user: { select: { id: true, name: true, email: true } } },
	});
	const grouped = new Map<string, QuizAttemptSummary>();
	for (const attempt of attempts) {
		const previous = grouped.get(attempt.userId);
		if (previous) {
			previous.attemptCount += 1;
			continue;
		}
		grouped.set(attempt.userId, {
			userId: attempt.user.id,
			userName: attempt.user.name,
			userEmail: attempt.user.email,
			attemptCount: 1,
			latestAttemptId: attempt.id,
			score: attempt.score,
			passed: attempt.passed,
			submittedAt: attempt.submittedAt,
			timeTakenSeconds: attempt.timeTakenSeconds,
		});
	}
	return [...grouped.values()];
}

export async function getQuizAttemptDetail(userId: string, courseId: string, attemptId: string): Promise<QuizAttemptDetail> {
	const attempt = await db.quizAttempt.findUnique({
		where: { id: attemptId },
		include: { user: { select: { id: true, name: true, email: true } } },
	});
	if (!attempt) throw new ORPCError("NOT_FOUND", { message: "找不到指定作答紀錄。" });
	const definition = await getQuizDefinition(attempt.pluginContentId);
	if (!definition) throw new ORPCError("NOT_FOUND", { message: "找不到指定測驗。" });
	const lesson = await db.lesson.findUnique({ where: { id: definition.body.lessonId }, select: { chapter: { select: { courseId: true } } } });
	if (!lesson || lesson.chapter.courseId !== courseId) throw new ORPCError("NOT_FOUND", { message: "找不到指定作答紀錄。" });
	await requireCourseManageAccess(userId, lesson.chapter.courseId);

	const answers = attempt.answers && typeof attempt.answers === "object" ? (attempt.answers as Record<string, unknown>) : {};
	return {
		id: attempt.id,
		lessonId: definition.body.lessonId,
		userId: attempt.user.id,
		userName: attempt.user.name,
		userEmail: attempt.user.email,
		score: attempt.score,
		passed: attempt.passed,
		submittedAt: attempt.submittedAt,
		questions: definition.body.questions.map((question) => {
			const selectedAnswer = answers[question.id];
			const correctAnswer = question.correctAnswer;
			const correct = JSON.stringify(selectedAnswer) === JSON.stringify(correctAnswer);
			return { id: question.id, content: question.content, selectedAnswer, correctAnswer, correct };
		}),
	};
}
