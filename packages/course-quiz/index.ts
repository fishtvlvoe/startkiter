import { db } from "@startkiter/database";

export {
	createQuizDefinition,
	getQuizDefinition,
	getQuizDefinitionByLessonId,
	getQuizForLearner,
	toLearnerQuiz,
	quizDefinitionBodySchema,
} from "./quiz-definition";
export type {
	CreateQuizDefinitionInput,
	LearnerQuiz,
	LearnerQuizQuestion,
	QuizDefinitionBody,
	QuizQuestion,
} from "./quiz-definition";
export { gradeQuiz } from "./quiz-grading";
export type { QuizAnswer, QuizGrade } from "./quiz-grading";
export { createQuizStartToken, verifyQuizStartToken } from "./quiz-session";
export type { QuizStartTokenInput } from "./quiz-session";

export type RecordQuizAttemptInput = {
	userId: string;
	pluginContentId: string;
	answers: Record<string, string | string[] | boolean>;
	score: number;
	passed: boolean;
	timeTakenSeconds?: number | null;
	startedAt?: Date;
};

export async function recordQuizAttempt(input: RecordQuizAttemptInput) {
	return db.quizAttempt.create({
		data: {
			userId: input.userId,
			pluginContentId: input.pluginContentId,
			answers: input.answers,
			score: input.score,
			passed: input.passed,
			timeTakenSeconds: input.timeTakenSeconds ?? null,
			...(input.startedAt ? { startedAt: input.startedAt } : {}),
		},
	});
}

export async function hasPassedQuiz(userId: string, pluginContentId: string) {
	const attempt = await db.quizAttempt.findFirst({
		where: { userId, pluginContentId, passed: true },
		select: { id: true },
	});

	return attempt !== null;
}
