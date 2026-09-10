import { describe, expect, it } from "vitest";

import { renderWelcomeEmailFromBlocks } from "./welcome-email-render";

function heading(text: string, id = "h1") {
	return {
		id,
		type: "heading",
		props: { level: 1 },
		content: [{ type: "text", text, styles: {} }],
		children: [],
	};
}

function paragraph(
	parts: Array<{ text: string; bold?: boolean; italic?: boolean; href?: string }>,
	id = "p1",
) {
	return {
		id,
		type: "paragraph",
		props: {},
		content: parts.map((part) =>
			part.href
				? {
						type: "link",
						href: part.href,
						content: [{ type: "text", text: part.text, styles: {} }],
					}
				: {
						type: "text",
						text: part.text,
						styles: {
							...(part.bold ? { bold: true } : {}),
							...(part.italic ? { italic: true } : {}),
						},
					},
		),
		children: [],
	};
}

function bullet(text: string, id = "li1") {
	return {
		id,
		type: "bulletListItem",
		props: {},
		content: [{ type: "text", text, styles: {} }],
		children: [],
	};
}

function ctaButton(text: string, url: string, id = "cta1") {
	return {
		id,
		type: "ctaButton",
		props: { text, url },
		content: undefined,
		children: [],
	};
}

const baseContext = {
	userName: "Fish",
	courseName: "開站包",
	courseUrl: "https://startkiter.com/course/abc",
	brandColor: "#365314",
};

describe("renderWelcomeEmailFromBlocks", () => {
	it("renders heading, bold paragraph, list, link, and CTA button into email-safe HTML", async () => {
		const contentJson = JSON.stringify([
			heading("歡迎加入"),
			paragraph([{ text: "請", bold: false }, { text: "立刻開始", bold: true }]),
			bullet("第一步"),
			paragraph([{ text: "課程入口", href: "https://startkiter.com/course/abc" }], "link-p"),
			ctaButton("開始上課", "/course/abc"),
		]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, baseContext);

		expect(rendered.html).toContain("<h1");
		expect(rendered.html).toContain("歡迎加入");
		expect(rendered.html).toContain("<strong>");
		expect(rendered.html).toContain("立刻開始");
		expect(rendered.html).toMatch(/<ul[\s>]|<li[\s>]/);
		expect(rendered.html).toContain("第一步");
		expect(rendered.html).toContain('href="https://startkiter.com/course/abc"');
		expect(rendered.html).toContain("開始上課");
		expect(rendered.html).toContain("max-width:600px");
	});

	it("strips script tags and onerror handlers from rendered HTML", async () => {
		const contentJson = JSON.stringify([
			paragraph([{ text: '<img src=x onerror=alert(1)><script>alert(2)</script>' }]),
		]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, baseContext);

		expect(rendered.html.toLowerCase()).not.toContain("onerror");
		expect(rendered.html.toLowerCase()).not.toContain("<script");
	});

	it("skips unknown block types without failing", async () => {
		const contentJson = JSON.stringify([
			paragraph([{ text: "before" }], "before"),
			{ id: "weird", type: "spaceShip", props: {}, content: [], children: [] },
			paragraph([{ text: "after" }], "after"),
		]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, baseContext);

		expect(rendered.html).toContain("before");
		expect(rendered.html).toContain("after");
		expect(rendered.html.toLowerCase()).not.toContain("spaceship");
	});

	it("throws when rendered HTML exceeds 256KB", async () => {
		const huge = "A".repeat(260 * 1024);
		const contentJson = JSON.stringify([paragraph([{ text: huge }])]);

		await expect(renderWelcomeEmailFromBlocks(contentJson, baseContext)).rejects.toThrow(
			/size limit|256/i,
		);
	});

	it("generates plain text with button as text (url)", async () => {
		const contentJson = JSON.stringify([
			ctaButton("開始上課", "https://startkiter.com/course/abc"),
		]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, baseContext);

		expect(rendered.text).toContain("開始上課 (https://startkiter.com/course/abc)");
	});

	it("interpolates template variables on rendered HTML and text with escaping", async () => {
		const contentJson = JSON.stringify([
			paragraph([{ text: "你好 {{userName}}，歡迎加入 {{courseName}}：{{courseUrl}}" }]),
		]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, {
			userName: "Amy_[test]",
			courseName: "開站包",
			courseUrl: "https://startkiter.com/course/abc",
		});

		expect(rendered.html).toContain("Amy_[test]");
		expect(rendered.html).not.toContain("Amy\\_\\[test\\]");
		expect(rendered.html).not.toMatch(/<test>/i);
		expect(rendered.text).toContain("Amy\\_\\[test\\]");
	});

	it("does not allow markup re-injection via interpolated variable values", async () => {
		const contentJson = JSON.stringify([
			paragraph([{ text: "你好 {{userName}}" }]),
			ctaButton("前往", "{{courseUrl}}"),
		]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, {
			userName: '<script>alert(1)</script><img src=x onerror=alert(2)>',
			courseName: "開站包",
			courseUrl: 'https://startkiter.com/course/abc" onmouseover="evil',
		});

		const lower = rendered.html.toLowerCase();
		expect(lower).not.toContain("<script");
		expect(lower).not.toContain("onerror");
		expect(lower).not.toContain("onmouseover");
		expect(lower).toContain("&lt;script&gt;");
	});

	it("blocks entity-encoded and whitespace-obfuscated javascript URLs", async () => {
		const rendered = await renderWelcomeEmailFromBlocks(
			JSON.stringify([
				paragraph([{ text: "a", href: "java&#x73;cript:alert(1)" }], "enc"),
				paragraph([{ text: "b", href: "j a v a s c r i p t:alert(2)" }], "ws"),
				paragraph([{ text: "c", href: "data:text/html,<script>alert(3)</script>" }], "data"),
			]),
			baseContext,
		);

		expect(rendered.html).not.toContain("java&#x73;cript");
		expect(rendered.html).not.toContain("alert(1)");
		expect(rendered.html).not.toContain("alert(2)");
		expect(rendered.html).not.toContain("data:text/html");
	});

	it("falls back to the default brand color when an invalid brandColor is supplied", async () => {
		const contentJson = JSON.stringify([ctaButton("開始上課", "/course/abc")]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, {
			...baseContext,
			brandColor: 'red;position:fixed;url(javascript:alert(1))',
		});

		expect(rendered.html).toContain("#365314");
		expect(rendered.html.toLowerCase()).not.toContain("position:fixed");
	});

	it("strips position:fixed from inline styles during sanitization", async () => {
		const contentJson = JSON.stringify([
			paragraph([{ text: "plain" }]),
		]);

		const rendered = await renderWelcomeEmailFromBlocks(contentJson, baseContext);
		const sanitized = rendered.html;
		expect(sanitized).toContain("plain");

		const { sanitizeEmailHtml } = await import("./welcome-email-render");
		expect(sanitizeEmailHtml('<div style="position:fixed;top:0">x</div>')).not.toContain("position:fixed");
		expect(sanitizeEmailHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
		expect(sanitizeEmailHtml('<a href=javascript:alert(1)>x</a>')).not.toContain("javascript:");
	});
});
