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
});
