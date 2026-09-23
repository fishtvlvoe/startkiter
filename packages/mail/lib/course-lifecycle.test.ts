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

	it("renders from contentJson when present instead of markdownTemplate", async () => {
		const contentJson = JSON.stringify([
			{
				id: "h1",
				type: "heading",
				props: { level: 1 },
				content: [{ type: "text", text: "區塊標題", styles: {} }],
				children: [],
			},
			{
				id: "p1",
				type: "paragraph",
				props: {},
				content: [{ type: "text", text: "區塊內文", styles: {} }],
				children: [],
			},
		]);

		const rendered = await renderCourseWelcomeEmail({
			userName: "Fish",
			courseName: "開站包",
			markdown: "這段舊 Markdown 不該出現",
			contentJson,
			courseUrl: "https://app.startkiter.dev/course/startkiter",
		});

		expect(rendered.html).toContain("區塊標題");
		expect(rendered.html).toContain("區塊內文");
		expect(rendered.html).not.toContain("這段舊 Markdown 不該出現");
		expect(rendered.text).toContain("區塊標題");
	});

	it("falls back to Markdown rendering when contentJson is null", async () => {
		const rendered = await renderCourseWelcomeEmail({
			userName: "Fish",
			courseName: "開站包",
			markdown: "從課程入口開始。",
			contentJson: null,
		});

		expect(rendered.html).toContain("從課程入口開始。");
		expect(rendered.html).toContain("開站包");
	});

	it("renders Markdown emphasis and links as HTML in the legacy fallback", async () => {
		const rendered = await renderCourseWelcomeEmail({
			userName: "Fish",
			courseName: "開站包",
			markdown: "**電馭學院**\n\n[開始上課](https://app.startkiter.dev/course/startkiter)",
			contentJson: null,
		});

		expect(rendered.html).toMatch(/<strong(?:\s[^>]*)?>電馭學院<\/strong>/);
		expect(rendered.html).toMatch(
			/<a href="https:\/\/app\.startkiter\.dev\/course\/startkiter"[^>]*>開始上課<\/a>/,
		);
		expect(rendered.html).not.toContain("**電馭學院**");
		expect(rendered.html).not.toContain("[開始上課](https://app.startkiter.dev/course/startkiter)");
	});
});
