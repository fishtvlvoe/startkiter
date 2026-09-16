import { describe, expect, it, vi } from "vitest";

import { renderCampaignHtml, type NewsletterContentJson } from "./render";
import { verifyUnsubscribeToken } from "./unsubscribe-token";

const campaign: NewsletterContentJson = {
	blocks: [
		{ type: "heading", props: { level: 1 }, content: "產品更新" },
		{ type: "paragraph", content: "這是一段電子報內容。" },
		{ type: "image", props: { src: "https://example.com/hero.png", alt: "產品截圖" } },
		{ type: "button", props: { text: "查看詳情", url: "https://example.com/details" } },
	],
};

describe("renderCampaignHtml", () => {
	it("adds a signed recipient-specific unsubscribe link and sender address footer", () => {
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-2026");
		const rendered = renderCampaignHtml(campaign, {
			mode: "send",
			appUrl: "https://app.startkiter.dev",
			recipientUserId: "user-1",
			recipientEmail: "learner@example.com",
			unsubscribeScope: "marketing",
			senderPhysicalAddress: "台北市中正區測試路 1 號",
		});

		const href = rendered.html.match(/href="([^"]*\/unsubscribe\?[^\"]+)"/)?.[1]?.replace(/&amp;/g, "&");
		expect(href).toBeTruthy();
		const unsubscribeUrl = new URL(href!);
		const token = unsubscribeUrl.searchParams.get("token");
		expect(unsubscribeUrl.searchParams.get("userId")).toBe("user-1");
		expect(unsubscribeUrl.searchParams.get("email")).toBe("learner@example.com");
		expect(unsubscribeUrl.searchParams.get("scope")).toBe("marketing");
		expect(token).toBeTruthy();
		expect(
			verifyUnsubscribeToken({
				userId: "user-1",
				email: "learner@example.com",
				scope: "marketing",
				token: token!,
			}),
		).toBe(true);
		expect(rendered.html).toContain("台北市中正區測試路 1 號");
	});

	it("blocks a promotional send when the sender physical address is missing", () => {
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-2026");

		expect(() =>
			renderCampaignHtml(campaign, {
				mode: "send",
				recipientUserId: "user-1",
				recipientEmail: "learner@example.com",
				unsubscribeScope: "marketing",
			}),
		).toThrow(/physical sender address/i);
	});

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
