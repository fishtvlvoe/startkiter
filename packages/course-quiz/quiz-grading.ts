import type { QuizQuestion } from "./quiz-definition";

export type QuizAnswer = string | string[] | boolean;

export type QuizGrade = {
	score: number;
	passed: boolean;
	correctQuestionIds: string[];
};

export type GradeableQuestion =
	| Pick<Extract<QuizQuestion, { type: "SINGLE_CHOICE" }>, "id" | "type" | "correctAnswer" | "points">
	| Pick<Extract<QuizQuestion, { type: "MULTIPLE_CHOICE" }>, "id" | "type" | "correctAnswer" | "points">
	| Pick<Extract<QuizQuestion, { type: "TRUE_FALSE" }>, "id" | "type" | "correctAnswer" | "points">
	| Pick<Extract<QuizQuestion, { type: "FILL_IN_BLANK" }>, "id" | "type" | "correctAnswer" | "points">;

function sameStringArray(left: string[], right: string[]) {
	if (left.length !== right.length) return false;

	const sortedLeft = [...left].sort();
	const sortedRight = [...right].sort();
	return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function isCorrect(question: GradeableQuestion, answer: QuizAnswer | undefined) {
	switch (question.type) {
		case "SINGLE_CHOICE":
		case "TRUE_FALSE":
			return answer === question.correctAnswer;
		case "MULTIPLE_CHOICE":
			return Array.isArray(answer) && sameStringArray(answer, question.correctAnswer);
		case "FILL_IN_BLANK":
			return (
				typeof answer === "string" &&
				question.correctAnswer.some((acceptedAnswer) => acceptedAnswer.trim().toLowerCase() === answer.trim().toLowerCase())
			);
	}
}

export function gradeQuiz(
	questions: GradeableQuestion[],
	answers: Record<string, QuizAnswer>,
	passingScore: number,
): QuizGrade {
	const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
	const correctQuestionIds = questions
		.filter((question) => isCorrect(question, answers[question.id]))
		.map((question) => question.id);
	const earnedPoints = questions
		.filter((question) => correctQuestionIds.includes(question.id))
		.reduce((sum, question) => sum + question.points, 0);
	const score = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);

	return { score, passed: score >= passingScore, correctQuestionIds };
}
