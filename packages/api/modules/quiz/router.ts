import { ORPCError } from "@orpc/server";
import {
	createQuizDefinition,
	getQuizDefinition,
	gradeQuiz,
	recordQuizAttempt,
	toLearnerQuiz,
	quizDefinitionBodySchema,
	createQuizStartToken,
	verifyQuizStartToken,
	type QuizAnswer,
} from "@startkiter/course-quiz";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../orpc/procedures";
import { userCanAccessCourseId } from "../course/lib/course-access";
import { isOperator } from "@startkiter/permissions";

const quizOperatorProcedure = protectedProcedure.use(async ({ context, next }) => {
	if (!isOperator(context.user, process.env.ADMIN_EMAIL)) {
		throw new ORPCError("FORBIDDEN");
	}

	return next();
});

const quizAnswerSchema = z.union([z.string(), z.array(z.string()), z.boolean()]);
const quizAnswersSchema = z.record(z.string(), quizAnswerSchema);

async function getAccessibleQuiz(pluginContentId: string, userId: string) {
	const definition = await getQuizDefinition(pluginContentId);
	if (!definition) throw new ORPCError("NOT_FOUND");

	const lesson = await db.lesson.findUnique({
		where: { id: definition.body.lessonId },
		select: { status: true, isFreePreview: true, chapter: { select: { courseId: true } } },
	});
	if (!lesson || lesson.status !== "PUBLISHED") throw new ORPCError("NOT_FOUND");

	if (!lesson.isFreePreview && !(await userCanAccessCourseId(userId, lesson.chapter.courseId))) {
		throw new ORPCError("FORBIDDEN");
	}

	return definition;
}

export const quizRouter = {
	create: quizOperatorProcedure
		.route({ method: "POST", path: "/quiz", tags: ["Quiz"], summary: "Create a quiz" })
		.input(z.object({ title: z.string().trim().min(1).max(200), body: quizDefinitionBodySchema }))
		.handler(async ({ input, context }) => {
			const lesson = await db.lesson.findUnique({ where: { id: input.body.lessonId }, select: { id: true } });
			if (!lesson) throw new ORPCError("NOT_FOUND", { message: "找不到指定單元。" });

			return createQuizDefinition({ authorId: context.user.id, title: input.title, body: input.body });
		}),
	get: protectedProcedure
		.route({ method: "GET", path: "/quiz/{pluginContentId}", tags: ["Quiz"], summary: "Get a learner quiz" })
		.input(z.object({ pluginContentId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const definition = await getAccessibleQuiz(input.pluginContentId, context.user.id);
			return toLearnerQuiz(definition);
		}),
	start: protectedProcedure
		.route({ method: "POST", path: "/quiz/{pluginContentId}/start", tags: ["Quiz"], summary: "Start a quiz" })
		.input(z.object({ pluginContentId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const definition = await getAccessibleQuiz(input.pluginContentId, context.user.id);
			return { startToken: createQuizStartToken({ userId: context.user.id, pluginContentId: definition.id }) };
		}),
	submit: protectedProcedure
		.route({ method: "POST", path: "/quiz/{pluginContentId}/attempts", tags: ["Quiz"], summary: "Submit a quiz attempt" })
		.input(
			z.object({
				pluginContentId: z.string().min(1),
				answers: quizAnswersSchema,
				startToken: z.string().min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			const definition = await getAccessibleQuiz(input.pluginContentId, context.user.id);
			const start = verifyQuizStartToken(input.startToken);
			if (!start || start.userId !== context.user.id || start.pluginContentId !== definition.id) {
				throw new ORPCError("BAD_REQUEST", { message: "測驗作答工作階段無效，請重新開始。" });
			}

			const now = Date.now();
			const startedAt = new Date(start.startedAt);
			const elapsedSeconds = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

			if (definition.body.timeLimitMinutes !== null && elapsedSeconds > definition.body.timeLimitMinutes * 60) {
				throw new ORPCError("BAD_REQUEST", { message: "測驗已超過時間限制。" });
			}

			const grade = gradeQuiz(
				definition.body.questions,
				input.answers as Record<string, QuizAnswer>,
				definition.body.passingScore,
			);
			await recordQuizAttempt({
				userId: context.user.id,
				pluginContentId: definition.id,
				answers: input.answers,
				score: grade.score,
				passed: grade.passed,
				timeTakenSeconds: elapsedSeconds,
				startedAt,
			});

			const canRevealAnswers =
				definition.body.showAnswers === "IMMEDIATELY" ||
				(definition.body.showAnswers === "AFTER_PASS" && grade.passed);

			return {
				score: grade.score,
				passed: grade.passed,
				...(canRevealAnswers
					? {
						correctQuestionIds: grade.correctQuestionIds,
						correctAnswers: Object.fromEntries(
							definition.body.questions.map((question) => [question.id, question.correctAnswer]),
						),
					}
					: {}),
			};
		}),
	hasPassed: protectedProcedure
		.route({ method: "GET", path: "/quiz/{pluginContentId}/passed", tags: ["Quiz"], summary: "Check quiz pass status" })
		.input(z.object({ pluginContentId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const attempt = await db.quizAttempt.findFirst({
				where: { userId: context.user.id, pluginContentId: input.pluginContentId, passed: true },
				select: { id: true },
			});
			return { passed: attempt !== null };
		}),
};
