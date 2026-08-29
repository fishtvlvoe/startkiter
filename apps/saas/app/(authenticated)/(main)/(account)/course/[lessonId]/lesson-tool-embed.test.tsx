import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LessonToolEmbed } from "./lesson-tool-embed";

const PROTECTED_HREF = "/lesson-tool/lesson-1/abc?token=tok";

describe("LessonToolEmbed (Requirement: Embedded tool renders in a sandboxed iframe alongside lesson content)", () => {
	it("loads the sandboxed iframe from the token-protected path, not the raw tool URL", () => {
		const html = renderToStaticMarkup(
			<LessonToolEmbed title="白板練習" embedHref={PROTECTED_HREF} />,
		);

		expect(html).toContain("<iframe");
		expect(html).toContain('sandbox="allow-scripts allow-forms allow-popups allow-downloads"');
		expect(html).toContain(PROTECTED_HREF);
		expect(html).toContain("白板練習");
		expect(html).toContain("在新分頁開啟");
		expect(html).not.toContain("https://tools.example.com");
	});

	it("renders nothing when the lesson has no protected embed path", () => {
		const html = renderToStaticMarkup(<LessonToolEmbed title="白板練習" embedHref="" />);

		expect(html).toBe("");
	});
});
