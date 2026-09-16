import { describe, expect, it } from "vitest";

import {
	createPromoCountdownBlock,
	createPromoCouponBlock,
	createPromoCourseBlock,
	renderCampaignHtml,
	type NewsletterContentJson,
} from "./render";

/**
 * Wave 2 convergence: composer contentJson (Wave 2C) must render through
 * promo-blocks helpers (Wave 2D) without type/field mismatches.
 */
describe("Wave 2C/2D contentJson + promo integration", () => {
	it("renders a campaign with base blocks and promo blocks end-to-end", () => {
		const couponBlock = createPromoCouponBlock({
			id: "coupon-wave2",
			code: "WAVE2SAVE",
			active: true,
			expiresAt: new Date("2026-12-31T15:59:59.000Z"),
			maxRedemptions: 50,
			timesRedeemed: 0,
		});

		const courseBlock = createPromoCourseBlock({
			id: "course-wave2",
			slug: "startkiter",
			title: "開站包",
			coverImageUrl: "https://cdn.example.com/cover.png",
			priceTwd: 8800,
			urlPath: "/courses/startkiter",
		});

		const countdownBlock = createPromoCountdownBlock(
			new Date("2026-10-01T15:59:59.000Z"),
		);

		const contentJson: NewsletterContentJson = {
			meta: { campaignSlug: "wave2-acceptance" },
			blocks: [
				{ type: "heading", props: { level: 1 }, content: "Wave 2 驗收促銷信" },
				{ type: "paragraph", content: "含標題、段落、圖片與促銷區塊。" },
				{
					type: "image",
					props: {
						src: "https://cdn.example.com/hero.png",
						alt: "促銷主視覺",
					},
				},
				couponBlock,
				courseBlock,
				countdownBlock,
			],
		};

		const preview = renderCampaignHtml(contentJson, {
			mode: "preview",
			appUrl: "https://app.startkiter.dev",
			campaignSlug: "wave2-acceptance",
		});
		const testSend = renderCampaignHtml(contentJson, {
			mode: "test",
			appUrl: "https://app.startkiter.dev",
			campaignSlug: "wave2-acceptance",
		});
		const realSend = renderCampaignHtml(contentJson, {
			mode: "send",
			appUrl: "https://app.startkiter.dev",
			campaignSlug: "wave2-acceptance",
		});

		expect(preview.html).toContain("Wave 2 驗收促銷信");
		expect(preview.html).toContain("WAVE2SAVE");
		expect(preview.html).toContain("開站包");
		expect(preview.html).toContain("NT$8,800");
		expect(preview.html).toContain("utm_source=newsletter");
		expect(preview.html).toContain("utm_campaign=wave2-acceptance");
		expect(preview.html).toContain("優惠倒數至");
		expect(preview.html).not.toMatch(/<script\b/i);
		expect(preview.html).not.toMatch(/display\s*:\s*(?:flex|grid)/i);

		expect(preview.text).toContain("WAVE2SAVE");
		expect(preview.text).toContain("開站包");
		expect(preview.text.trim().length).toBeGreaterThan(0);

		expect(preview.html).toBe(realSend.html);
		expect(testSend.html).toContain('data-newsletter-test-banner="true"');
		expect(
			testSend.html.replace(
				/<tr data-newsletter-test-banner="true">[\s\S]*?<\/tr>/,
				"",
			),
		).toBe(realSend.html);

		if (couponBlock.type !== "coupon") throw new Error("expected a coupon block");
		if (courseBlock.type !== "course") throw new Error("expected a course block");
		if (countdownBlock.type !== "countdown") throw new Error("expected a countdown block");
		expect(couponBlock.props.codeReadOnly).toBe(true);
		expect(courseBlock.props.priceReadOnly).toBe(true);
		expect(courseBlock.props.urlReadOnly).toBe(true);
		expect(countdownBlock.props.text).toMatch(/優惠倒數至/);
	});
});
