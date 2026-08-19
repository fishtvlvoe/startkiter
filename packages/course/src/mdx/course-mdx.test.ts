import { describe, expect, it } from "vitest";

import { parseCourseMdx, validateCourseMdx } from "./course-mdx";

describe("parseCourseMdx", () => {
	it("accepts only the seven registered interactive blocks", () => {
		const result = parseCourseMdx([
			"# 單元標題",
			'<TimelineSync id="timeline-1" at="01:30" title="重點" />',
			"<ConceptCompare id=\"compare-1\" tabs='[{\"title\":\"A\",\"description\":\"內容\"}]' />",
			"<MicroSandbox id=\"sandbox-1\" controls='[{\"name\":\"size\",\"type\":\"slider\",\"default\":2}]' />",
			"<WorkflowSorter id=\"sort-1\" items='[\"A\",\"B\"]' correctOrder='[\"A\",\"B\"]' />",
			"<InstantQuiz id=\"quiz-1\" question=\"題目\" options='[\"A\",\"B\"]' answerIndex=\"0\" explanation=\"說明\" />",
			'<TeacherAvatar id="teacher-1" caption="提示" mood="explaining" />',
			"<DialogueWindow id=\"dialogue-1\" prompts='[{\"question\":\"問題\",\"answer\":\"答案\"}]' />",
		].join("\n"));

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.blocks.map((block) => block.type)).toEqual([
				"TimelineSync",
				"ConceptCompare",
				"MicroSandbox",
				"WorkflowSorter",
				"InstantQuiz",
				"TeacherAvatar",
				"DialogueWindow",
			]);
		}
	});

	it("rejects raw HTML, scripts, event handlers, and unknown components", () => {
		for (const source of [
			"<script>alert(1)</script>",
			'<TimelineSync at="00:01" onClick="alert(1)" />',
			"<UnregisteredBlock />",
			"<div>raw html</div>",
		]) {
			expect(parseCourseMdx(source).ok).toBe(false);
		}
	});

	it("normalizes timeline input and rejects a range beyond the verified duration", () => {
		expect(
			validateCourseMdx('<TimelineSync at="01:30" end="02:00" />', {
				durationSeconds: 180,
			}).ok,
		).toBe(true);
		expect(
			validateCourseMdx('<TimelineSync at="03:01" />', {
				durationSeconds: 180,
			}).ok,
		).toBe(false);
		expect(parseCourseMdx('<TimelineSync at="02:00" end="01:59" />').ok).toBe(false);
	});

	it("rejects unregistered props and malformed interactive schemas before rendering", () => {
		for (const source of [
			'<InstantQuiz question="題目" options=\'["A","B"]\' answerIndex="2" explanation="說明" />',
			'<MicroSandbox controls=\'[{"name":"mode","type":"select","default":"A","options":[{"value":1}]}]\' />',
			'<WorkflowSorter items=\'["A","B"]\' correctOrder=\'["A","C"]\' />',
			'<TimelineSync at="00:01" extra="not-allowed" />',
		]) {
			expect(parseCourseMdx(source).ok).toBe(false);
		}
	});
});
