import { describe, expect, it } from "vitest";

import { renderCampaignHtml, type NewsletterContentJson } from "./render";

const campaign: NewsletterContentJson = {
	blocks: [
		{ type: "heading", props: { level: 1 }, content: "產品更新" },
		{ type: "paragraph", content: "這是一段電子報內容。" },
		{ type: "image", props: { src: "https://example.com/hero.png", alt: "產品截圖" } },
		{ type: "button", props: { text: "查看詳情", url: "https://example.com/details" } },
	],
};

describe("renderCampaignHtml", () => {
	it("uses one HTML output for preview, test send, and real send", () => {
		const preview = renderCampaignHtml(campaign, { mode: "preview" });
		const testSend = renderCampaignHtml(campaign, { mode: "test" });
		const realSend = renderCampaignHtml(campaign, { mode: "send" });

		expect(preview.html).toBe(realSend.html);
		expect(testSend.html).toContain('data-newsletter-test-banner="true"');
		expect(testSend.html.replace(/<tr data-newsletter-test-banner="true">[\s\S]*?<\/tr>/, "")).toBe(
			realSend.html,
		);
	});

	it("renders email-safe table layout with inline styles", () => {
		const { html } = renderCampaignHtml(campaign);

		expect(html).toContain("<table");
		expect(html).toContain('width="600"');
		expect(html).toContain('style="');
		expect(html).not.toMatch(/<style\b/i);
		expect(html).not.toMatch(/display\s*:\s*(?:flex|grid)/i);
	});

	it("warns when sanitized HTML exceeds 102KB", () => {
		const oversized = renderCampaignHtml({
			blocks: [{ type: "paragraph", content: "x".repeat(103 * 1024) }],
		});

		expect(oversized.sizeBytes).toBeGreaterThan(102 * 1024);
		expect(oversized.warnings.some((warning) => warning.includes("102KB"))).toBe(true);
		expect(oversized.isOversized).toBe(true);
	});

	it("sanitizes script tags before returning preview and send HTML", () => {
		const rendered = renderCampaignHtml({
			blocks: [
				{ type: "paragraph", content: '<script>alert("x")</script>安全文字' },
			],
		});

		expect(rendered.html).not.toMatch(/<script|alert\(/i);
		expect(rendered.html).toContain("安全文字");
	});

	it("derives a non-empty plain-text alternative from the blocks", () => {
		const rendered = renderCampaignHtml(campaign);

		expect(rendered.text.trim()).toContain("產品更新");
		expect(rendered.text.trim()).toContain("查看詳情");
	});
});
