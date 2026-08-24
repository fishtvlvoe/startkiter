import { describe, expect, it } from "vitest";

import { gradeQuiz } from "./quiz-grading";

describe("Quiz grading", () => {
	it("grades single-choice answers", () => {
		expect(
			gradeQuiz(
				[
					{ id: "q1", type: "SINGLE_CHOICE", correctAnswer: "b", points: 2 },
				],
				{ q1: "b" },
				60,
			),
		).toMatchObject({ score: 100, passed: true });
	});

	it("grades multiple-choice answers regardless of answer order", () => {
		expect(
			gradeQuiz(
				[
					{ id: "q1", type: "MULTIPLE_CHOICE", correctAnswer: ["a", "c"], points: 1 },
				],
				{ q1: ["c", "a"] },
				60,
			),
		).toMatchObject({ score: 100, passed: true });
	});

	it("grades true-false and fill-in-blank answers", () => {
		expect(
			gradeQuiz(
				[
					{ id: "q1", type: "TRUE_FALSE", correctAnswer: true, points: 1 },
					{ id: "q2", type: "FILL_IN_BLANK", correctAnswer: ["StartKiter", "startkiter"], points: 1 },
				],
				{ q1: true, q2: "  STARTKITER " },
				60,
			),
		).toMatchObject({ score: 100, passed: true });

		expect(
			gradeQuiz(
				[{ id: "q1", type: "MULTIPLE_CHOICE", correctAnswer: ["a", "b"], points: 1 }],
				{ q1: ["a"] },
				60,
			),
		).toMatchObject({ score: 0, passed: false });
	});
});
