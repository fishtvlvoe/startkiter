import { describe, expect, it } from "vitest";

import { extractLessonBlockIds } from "./extract-lesson-block-ids";

describe("extractLessonBlockIds", () => {
	it("extracts declared blockId attributes from allowlisted MDX components", () => {
		const source = [
			"# lesson-03",
			"",
			'<InstantQuiz blockId="quiz-01" question="Q" options={["A","B"]} answerIndex={1} explanation="E" />',
			"",
			'<WorkflowSorter blockId="sorter-01" items={["a","b"]} correctOrder={["a","b"]} />',
		].join("\n");

		expect(extractLessonBlockIds(source)).toEqual(["quiz-01", "sorter-01"]);
	});

	it("skips interactive blocks that omit blockId without throwing", () => {
		const source =
			'<InstantQuiz question="Q" options={["A","B"]} answerIndex={1} explanation="E" />';

		expect(extractLessonBlockIds(source)).toEqual([]);
	});

	it("does not treat a generic id attribute as a blockId", () => {
		const source =
			'<InstantQuiz id="not-a-block" question="Q" options={["A","B"]} answerIndex={1} explanation="E" />';

		expect(extractLessonBlockIds(source)).toEqual([]);
	});

	it("returns unique ids in first-seen order", () => {
		const source = [
			'<InstantQuiz blockId="quiz-01" question="Q" options={["A"]} answerIndex={0} explanation="E" />',
			'<WorkflowSorter blockId="quiz-01" items={["a"]} correctOrder={["a"]} />',
			'<InstantQuiz blockId="quiz-02" question="Q2" options={["A"]} answerIndex={0} explanation="E" />',
		].join("\n");

		expect(extractLessonBlockIds(source)).toEqual(["quiz-01", "quiz-02"]);
	});

	it("returns an empty list when the source cannot be parsed", () => {
		expect(extractLessonBlockIds("<InstantQuiz blockId=")).toEqual([]);
	});
});
