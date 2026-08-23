import { describe, expect, it } from "vitest";

import { BLOCK_REGISTRY } from "./block-registry";
import { LESSON_MDX_COMPONENT_SET } from "./allowed-components";

describe("BLOCK_REGISTRY", () => {
	it("包含目前課程系統的八款互動積木", () => {
		expect(BLOCK_REGISTRY.map((block) => block.name)).toEqual([
			"TimelineSync",
			"ConceptCompare",
			"MicroSandbox",
			"WorkflowSorter",
			"InstantQuiz",
			"TeacherAvatar",
			"DialogueWindow",
			"WebContainerSandbox",
		]);
	});

	it("讓 MDX allowlist 與 registry 名稱保持一致", () => {
		expect([...LESSON_MDX_COMPONENT_SET]).toEqual(BLOCK_REGISTRY.map((block) => block.name));
	});

	it("用 WebContainerSandbox schema 驗證 JSON literal props", () => {
		const definition = BLOCK_REGISTRY.find((block) => block.name === "WebContainerSandbox");

		expect(
			definition?.propsSchema.safeParse({
				blockId: "sandbox-01",
				files: { "index.js": "console.log(1)" },
				testCommand: "npm test",
				hints: ["先看錯誤位置"],
			}).success,
		).toBe(true);
		expect(
			definition?.propsSchema.safeParse({
				blockId: "sandbox-01",
				files: ["not-an-object"],
				hints: [],
			}).success,
		).toBe(false);
	});

	it("拒絕未知 props、物件型 React child 與越界答案 index", () => {
		const instantQuiz = BLOCK_REGISTRY.find((block) => block.name === "InstantQuiz");
		const webContainer = BLOCK_REGISTRY.find((block) => block.name === "WebContainerSandbox");

		expect(
			webContainer?.propsSchema.safeParse({
				blockId: "sandbox-01",
				files: {},
				hints: [],
				unknown: true,
			}).success,
		).toBe(false);
		expect(
			instantQuiz?.propsSchema.safeParse({
				question: { unsafe: true },
				options: ["A", "B"],
				answerIndex: 0,
				explanation: "E",
			}).success,
		).toBe(false);
		expect(
			instantQuiz?.propsSchema.safeParse({
				question: "Q",
				options: ["A", "B"],
				answerIndex: 2,
				explanation: "E",
			}).success,
		).toBe(false);
	});
});
