import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LessonToolEmbed } from "./lesson-tool-embed";

describe("LessonToolEmbed (Requirement: Embedded tool renders in a sandboxed iframe alongside lesson content)", () => {
	it("renders a sandboxed iframe and new-tab link when a tool URL is configured", () => {
		const html = renderToStaticMarkup(
			<LessonToolEmbed
				title="白板練習"
				toolUrl="https://tools.example.com/whiteboard"
				newTabHref="/lesson-tool/lesson-1/abc?token=tok"
			/>,
		);

		expect(html).toContain("<iframe");
		expect(html).toContain('sandbox="allow-scripts allow-forms allow-popups allow-downloads"');
		expect(html).toContain("https://tools.example.com/whiteboard");
		expect(html).toContain("白板練習");
		expect(html).toContain("在新分頁開啟");
		expect(html).toContain("/lesson-tool/lesson-1/abc?token=tok");
	});

	it("renders nothing when the lesson has no tool URL", () => {
		const html = renderToStaticMarkup(
			<LessonToolEmbed title="白板練習" toolUrl="" newTabHref="/lesson-tool/lesson-1/abc" />,
		);

		expect(html).toBe("");
	});
});
