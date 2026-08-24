import { db } from "@startkiter/database";
import { z } from "zod";

const quizOptionSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(1),
});

const baseQuestionSchema = z.object({
	id: z.string().min(1),
	content: z.string().min(1),
	explanation: z.string().optional().nullable(),
	points: z.number().int().positive(),
});

const quizQuestionSchema = z.discriminatedUnion("type", [
	baseQuestionSchema.extend({
		type: z.literal("SINGLE_CHOICE"),
		options: z.array(quizOptionSchema).min(2),
		correctAnswer: z.string().min(1),
	}),
	baseQuestionSchema.extend({
		type: z.literal("MULTIPLE_CHOICE"),
		options: z.array(quizOptionSchema).min(2),
		correctAnswer: z.array(z.string().min(1)).min(1),
	}),
	baseQuestionSchema.extend({
		type: z.literal("TRUE_FALSE"),
		options: z.array(quizOptionSchema).length(2).optional(),
		correctAnswer: z.boolean(),
	}),
	baseQuestionSchema.extend({
		type: z.literal("FILL_IN_BLANK"),
		options: z.null().optional(),
		correctAnswer: z.array(z.string().min(1)).min(1),
	}),
]);

export const quizDefinitionBodySchema = z.object({
	lessonId: z.string().min(1),
	passingScore: z.number().int().min(0).max(100),
	timeLimitMinutes: z.number().int().positive().nullable(),
	shuffleQuestions: z.boolean(),
	shuffleOptions: z.boolean(),
	showAnswers: z.enum(["IMMEDIATELY", "AFTER_PASS", "NEVER"]),
	blockNextLesson: z.boolean(),
	questions: z.array(quizQuestionSchema).min(1),
});

export type QuizDefinitionBody = z.infer<typeof quizDefinitionBodySchema>;
export type QuizQuestion = QuizDefinitionBody["questions"][number];
export type LearnerQuizQuestion = Omit<QuizQuestion, "correctAnswer" | "explanation">;
export type LearnerQuiz = Omit<QuizDefinitionBody, "questions"> & {
	id: string;
	title: string;
	questions: LearnerQuizQuestion[];
};

const PLUGIN_ID = "quiz" as const;
const CONTENT_TYPE = "quiz-definition" as const;

export type CreateQuizDefinitionInput = {
	authorId: string;
	title: string;
	body: QuizDefinitionBody;
};

export async function createQuizDefinition(input: CreateQuizDefinitionInput) {
	const body = quizDefinitionBodySchema.parse(input.body);

	return db.pluginContent.create({
		data: {
			pluginId: PLUGIN_ID,
			type: CONTENT_TYPE,
			title: input.title.trim(),
			body,
			authorId: input.authorId,
		},
	});
}

export async function getQuizDefinition(pluginContentId: string) {
	const record = await db.pluginContent.findFirst({
		where: { id: pluginContentId, pluginId: PLUGIN_ID, type: CONTENT_TYPE },
	});

	if (!record) return null;

	return {
		...record,
		body: quizDefinitionBodySchema.parse(record.body),
	};
}

export async function getQuizDefinitionByLessonId(lessonId: string) {
	const records = await db.pluginContent.findMany({
		where: { pluginId: PLUGIN_ID, type: CONTENT_TYPE },
		orderBy: { createdAt: "asc" },
	});

	const record = records.find((candidate) => {
		const body = quizDefinitionBodySchema.safeParse(candidate.body);
		return body.success && body.data.lessonId === lessonId;
	});

	if (!record) return null;

	return {
		...record,
		body: quizDefinitionBodySchema.parse(record.body),
	};
}

export function toLearnerQuiz(
	definition: NonNullable<Awaited<ReturnType<typeof getQuizDefinition>>>,
): LearnerQuiz {
	return {
		id: definition.id,
		title: definition.title,
		lessonId: definition.body.lessonId,
		passingScore: definition.body.passingScore,
		timeLimitMinutes: definition.body.timeLimitMinutes,
		shuffleQuestions: definition.body.shuffleQuestions,
		shuffleOptions: definition.body.shuffleOptions,
		showAnswers: definition.body.showAnswers,
		blockNextLesson: definition.body.blockNextLesson,
		questions: definition.body.questions.map(({ correctAnswer: _correctAnswer, explanation: _explanation, ...question }) => question),
	};
}

export async function getQuizForLearner(pluginContentId: string) {
	const definition = await getQuizDefinition(pluginContentId);
	return definition ? toLearnerQuiz(definition) : null;
}
