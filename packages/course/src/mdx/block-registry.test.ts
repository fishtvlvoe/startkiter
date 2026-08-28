import { describe, expect, it } from "vitest";
import { createElement } from "react";

import { BLOCK_REGISTRY, MissionBlockRenderer, resolveMissionBlock } from "./block-registry";
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
			"MissionBlockRenderer",
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

	it("透過 surface 對照表將 Mission action 轉成既有積木 props", () => {
		const result = resolveMissionBlock({
			surface: "structured_form",
			fields: [
				{ key: "apiKey", label: "Bunny API Key", inputType: "text", required: true },
			],
		});
		if (!result.ok) throw new Error(result.error);

		expect(result).toEqual({
			ok: true,
			blockName: "DialogueWindow",
			props: {
				prompts: [{ question: "Bunny API Key", response: "text · 必填" }],
			},
		});

		const definition = BLOCK_REGISTRY.find((block) => block.name === result.blockName);
		expect(definition?.propsSchema.safeParse(result.props).success).toBe(true);
	});

	it("保留 embedded_tool 的模式與網址語意", () => {
		const result = resolveMissionBlock({
			surface: "embedded_tool",
			url: "https://example.com/tool",
			mode: "iframe",
		});

		if (!result.ok) throw new Error(result.error);

		expect(result).toEqual({
			ok: true,
			blockName: "ConceptCompare",
			props: {
				tabs: [{
					title: "iframe",
					description: "https://example.com/tool",
					code: "https://example.com/tool",
				}],
			},
		});

		const definition = BLOCK_REGISTRY.find((block) => block.name === result.blockName);
		expect(definition?.propsSchema.safeParse(result.props).success).toBe(true);
	});

	it("MissionBlockRenderer 實際渲染 structured_form 的欄位語意", async () => {
		const { renderToStaticMarkup } = await import("react-dom/server");
		const markup = renderToStaticMarkup(
			createElement(MissionBlockRenderer, {
				action: {
					surface: "structured_form",
					fields: [
						{ key: "apiKey", label: "Bunny API Key", inputType: "text", required: true },
						{ key: "zoneName", label: "Zone name", inputType: "text", required: false },
					],
				},
			}),
		);

		expect(markup).toContain('aria-label="Bunny API Key"');
		expect(markup).toContain('name="apiKey"');
		expect(markup).toContain('type="text"');
		expect(markup).toContain('required=""');
		expect(markup).toContain('name="zoneName"');
	});

	it("MissionBlockRenderer 實際渲染 embedded_tool 的可操作入口", async () => {
		const { renderToStaticMarkup } = await import("react-dom/server");
		const iframeMarkup = renderToStaticMarkup(
			createElement(MissionBlockRenderer, {
				action: { surface: "embedded_tool", url: "https://example.com/tool", mode: "iframe" },
			}),
		);
		const copyMarkup = renderToStaticMarkup(
			createElement(MissionBlockRenderer, {
				action: { surface: "embedded_tool", url: "npm run setup", mode: "copy_command" },
			}),
		);

		expect(iframeMarkup).toContain('src="https://example.com/tool"');
		expect(iframeMarkup).toContain('title="Mission embedded tool"');
		expect(copyMarkup).toContain('data-copy-value="npm run setup"');
		expect(copyMarkup).toContain("複製命令");
	});
});
