import { describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findMany: vi.fn() },
	},
}));

import {
	assertCouponValidForSend,
	assertPromoAudienceLocked,
	bindCouponBlock,
	bindCourseCardBlock,
	bindCountdownBlock,
	getPromoAudienceUiState,
	renderPromoBlockHtml,
	withUtmParams,
	type CatalogCourse,
	type CouponRecord,
} from "./promo-blocks";

const coupon: CouponRecord = {
	id: "coupon-1",
	code: "SAVE20",
	active: true,
	expiresAt: new Date("2026-12-31T15:59:59.000Z"),
	maxRedemptions: 100,
	timesRedeemed: 10,
};

const course: CatalogCourse = {
	id: "course-1",
	slug: "startkiter",
	title: "開站包",
	coverImageUrl: "https://cdn.example.com/cover.png",
	priceTwd: 8800,
	urlPath: "/courses/startkiter",
};

describe("coupon block bound to an existing coupon", () => {
	it("auto-fills a read-only coupon code from the Coupon record", () => {
		const block = bindCouponBlock(coupon);

		expect(block).toEqual({
			id: expect.any(String),
			type: "coupon",
			couponId: "coupon-1",
			code: "SAVE20",
			codeReadOnly: true,
			expiresAt: "2026-12-31T15:59:59.000Z",
		});
		expect(block.codeReadOnly).toBe(true);
		expect(() => {
			(block as { code: string }).code = "HACKED";
		}).not.toThrow();
		// Binding always wins over free-text: re-bind restores source of truth.
		expect(bindCouponBlock(coupon).code).toBe("SAVE20");
	});
});

describe("coupon validity checked before send", () => {
	it("blocks send when the coupon has expired", () => {
		const result = assertCouponValidForSend(
			{ ...coupon, expiresAt: new Date("2026-01-01T00:00:00.000Z") },
			new Date("2026-09-16T00:00:00.000Z"),
		);

		expect(result).toEqual({
			ok: false,
			reason: "coupon_expired",
		});
	});

	it("blocks send when the coupon is inactive or redeemed out", () => {
		expect(
			assertCouponValidForSend({ ...coupon, active: false }, new Date("2026-09-16T00:00:00.000Z")),
		).toEqual({ ok: false, reason: "coupon_inactive" });

		expect(
			assertCouponValidForSend(
				{ ...coupon, maxRedemptions: 10, timesRedeemed: 10 },
				new Date("2026-09-16T00:00:00.000Z"),
			),
		).toEqual({ ok: false, reason: "coupon_redemption_limit" });
	});
});

describe("course/bundle CTA card pulled from catalog data", () => {
	it("fills price from catalog and marks it read-only", () => {
		const block = bindCourseCardBlock(course);

		expect(block).toMatchObject({
			type: "course",
			courseId: "course-1",
			title: "開站包",
			priceLabel: "NT$8,800",
			priceReadOnly: true,
			urlReadOnly: true,
			imageUrl: "https://cdn.example.com/cover.png",
		});
		expect(block.priceLabel).toBe("NT$8,800");
	});
});

describe("static countdown text", () => {
	it("renders coupon expiry as static text without script or animation", () => {
		const block = bindCountdownBlock(coupon.expiresAt!);
		const html = renderPromoBlockHtml(block, {
			campaignSlug: "autumn-sale",
			appUrl: "https://app.startkiter.dev",
		});

		expect(block.type).toBe("countdown");
		expect(html).toContain("2026");
		expect(html).not.toMatch(/<script/i);
		expect(html).not.toMatch(/setInterval|requestAnimationFrame|animated/i);
		expect(html).not.toMatch(/<img[^>]+gif/i);
	});
});

describe("automatic UTM tagging on promotional links", () => {
	it("appends utm_source, utm_medium, utm_campaign, and utm_content", () => {
		const block = bindCourseCardBlock(course);
		const html = renderPromoBlockHtml(block, {
			campaignSlug: "autumn-sale",
			appUrl: "https://app.startkiter.dev",
			utmContent: "course-card",
		});

		expect(html).toContain("utm_source=newsletter");
		expect(html).toContain("utm_medium=email");
		expect(html).toContain("utm_campaign=autumn-sale");
		expect(html).toContain("utm_content=course-card");

		const tagged = withUtmParams("https://app.startkiter.dev/courses/startkiter", {
			campaign: "autumn-sale",
			content: "course-cta",
		});
		expect(tagged).toContain("utm_source=newsletter");
		expect(tagged).toContain("utm_medium=email");
		expect(tagged).toContain("utm_campaign=autumn-sale");
		expect(tagged).toContain("utm_content=course-cta");
	});
});

describe("marketing consent lock on promotional audience", () => {
	it("rejects API send requests that omit the marketing-consent filter", () => {
		expect(() =>
			assertPromoAudienceLocked({
				type: "PROMO",
				segment: { preset: "all" },
			}),
		).toThrow(/marketing.?consent/i);

		expect(() =>
			assertPromoAudienceLocked({
				type: "PROMO",
				segment: {
					mode: "AND",
					rules: [{ field: "coursePurchased", value: "course-1" }],
				},
			}),
		).toThrow(/marketing.?consent/i);

		expect(() =>
			assertPromoAudienceLocked({
				type: "PROMO",
				segment: {
					mode: "AND",
					rules: [{ field: "marketingConsent", value: true }],
				},
			}),
		).not.toThrow();
	});

	it("disables non-consent audience options in promo UI state", () => {
		const ui = getPromoAudienceUiState("PROMO");
		expect(ui.forceMarketingConsent).toBe(true);
		if (!("disabledPresets" in ui)) throw new Error("PROMO UI state must lock consent");
		expect(ui.disabledPresets).toEqual(expect.arrayContaining(["all"]));
		expect(ui.lockedRule).toEqual({ field: "marketingConsent", value: true });
		expect(ui.canEditMarketingConsentRule).toBe(false);
	});
});
