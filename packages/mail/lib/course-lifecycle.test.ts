import { describe, expect, it } from "vitest";

import { renderCourseWelcomeEmail } from "./course-lifecycle";

describe("renderCourseWelcomeEmail", () => {
	it("renders the course welcome email with lifecycle variables", async () => {
		const rendered = await renderCourseWelcomeEmail({
			userName: "Fish",
			courseName: "開站包",
			markdown: "從課程入口開始。",
		});

		expect(rendered.html).toContain("開站包");
		expect(rendered.html).toContain("Fish");
		expect(rendered.html).toContain("從課程入口開始。");
		expect(rendered.text).toContain("開站包");
		expect(rendered.text).toContain("Fish");
	});

	it("escapes raw HTML in operator markdown instead of treating it as another email type", async () => {
		const rendered = await renderCourseWelcomeEmail({
			userName: "Fish",
			courseName: "開站包",
			markdown: "<script>alert(1)</script>",
		});

		expect(rendered.html).toContain("&lt;script&gt;");
		expect(rendered.html).not.toContain("<script>alert(1)</script>");
	});
});
