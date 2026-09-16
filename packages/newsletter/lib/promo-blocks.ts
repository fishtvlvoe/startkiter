import { randomUUID } from "node:crypto";

import {
	enforcePromoAudienceSegment,
	PromoAudienceLockError,
	segmentHasMarketingConsentLock,
	type SegmentJson,
	type SegmentRule,
} from "./audience";

export type CouponRecord = {
	id: string;
	code: string;
	active: boolean;
	expiresAt: Date | null;
	maxRedemptions: number | null;
	timesRedeemed: number;
};

export type CatalogCourse = {
	id: string;
	slug: string;
	title: string;
	coverImageUrl?: string | null;
	priceTwd: number;
	urlPath: string;
};

export type CatalogBundle = {
	id: string;
	slug: string;
	title: string;
	coverImageUrl?: string | null;
	priceTwd: number;
	urlPath: string;
};

/** Provisional base + promo block types until Wave 2C exports contentJson from render.ts. */
export type PromoNewsletterBlock =
	| {
			id: string;
			type: "coupon";
			couponId: string;
			code: string;
			codeReadOnly: true;
			description?: string;
			expiresAt?: string;
	  }
	| {
			id: string;
			type: "course";
			courseId: string;
			title: string;
			imageUrl?: string;
			priceLabel: string;
			priceReadOnly: true;
			url: string;
			urlReadOnly: true;
	  }
	| {
			id: string;
			type: "bundle";
			bundleId: string;
			title: string;
			imageUrl?: string;
			priceLabel: string;
			priceReadOnly: true;
			url: string;
			urlReadOnly: true;
	  }
	| {
			id: string;
			type: "countdown";
			text: string;
			expiresAt?: string;
	  };

export type PromoRenderContext = {
	campaignSlug: string;
	appUrl: string;
	utmContent?: string;
};

export type CouponValidityResult =
	| { ok: true }
	| {
			ok: false;
			reason: "coupon_expired" | "coupon_inactive" | "coupon_redemption_limit" | "coupon_missing";
	  };

function formatPriceTwd(priceTwd: number): string {
	return `NT$${priceTwd.toLocaleString("en-US")}`;
}

function formatTaipeiDate(value: Date | string): string {
	const date = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat("zh-TW", {
		timeZone: "Asia/Taipei",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value);
}

function joinUrl(appUrl: string, path: string): string {
	if (/^https?:\/\//i.test(path)) return path;
	const base = appUrl.replace(/\/$/, "");
	const suffix = path.startsWith("/") ? path : `/${path}`;
	return `${base}${suffix}`;
}

export function withUtmParams(
	url: string,
	params: { campaign: string; content: string },
): string {
	const target = new URL(url);
	target.searchParams.set("utm_source", "newsletter");
	target.searchParams.set("utm_medium", "email");
	target.searchParams.set("utm_campaign", params.campaign);
	target.searchParams.set("utm_content", params.content);
	return target.toString();
}

export function bindCouponBlock(coupon: CouponRecord): Extract<PromoNewsletterBlock, { type: "coupon" }> {
	return {
		id: randomUUID(),
		type: "coupon",
		couponId: coupon.id,
		code: coupon.code,
		codeReadOnly: true,
		expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : undefined,
	};
}

export function bindCourseCardBlock(
	course: CatalogCourse,
): Extract<PromoNewsletterBlock, { type: "course" }> {
	return {
		id: randomUUID(),
		type: "course",
		courseId: course.id,
		title: course.title,
		imageUrl: course.coverImageUrl ?? undefined,
		priceLabel: formatPriceTwd(course.priceTwd),
		priceReadOnly: true,
		url: course.urlPath,
		urlReadOnly: true,
	};
}

export function bindBundleCardBlock(
	bundle: CatalogBundle,
): Extract<PromoNewsletterBlock, { type: "bundle" }> {
	return {
		id: randomUUID(),
		type: "bundle",
		bundleId: bundle.id,
		title: bundle.title,
		imageUrl: bundle.coverImageUrl ?? undefined,
		priceLabel: formatPriceTwd(bundle.priceTwd),
		priceReadOnly: true,
		url: bundle.urlPath,
		urlReadOnly: true,
	};
}

export function bindCountdownBlock(
	expiresAt: Date | string,
): Extract<PromoNewsletterBlock, { type: "countdown" }> {
	const iso = expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt;
	return {
		id: randomUUID(),
		type: "countdown",
		text: `優惠倒數至 ${formatTaipeiDate(expiresAt)}`,
		expiresAt: iso,
	};
}

export function assertCouponValidForSend(
	coupon: CouponRecord | null | undefined,
	now = new Date(),
): CouponValidityResult {
	if (!coupon) return { ok: false, reason: "coupon_missing" };
	if (!coupon.active) return { ok: false, reason: "coupon_inactive" };
	if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
		return { ok: false, reason: "coupon_expired" };
	}
	if (
		typeof coupon.maxRedemptions === "number" &&
		coupon.timesRedeemed >= coupon.maxRedemptions
	) {
		return { ok: false, reason: "coupon_redemption_limit" };
	}
	return { ok: true };
}

export function renderPromoBlockHtml(
	block: PromoNewsletterBlock,
	context: PromoRenderContext,
): string {
	switch (block.type) {
		case "coupon":
			return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#FFFBEB;border:1px solid #FCD34D;border-radius:12px;margin:24px 0;"><tr><td style="padding:20px;text-align:center;"><p style="margin:0 0 8px 0;color:#92400E;font-size:14px;font-weight:700;">限時優惠碼</p><p style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:1px;background:#FFFFFF;border:1px dashed #F5A524;border-radius:10px;color:#0F172A;font-size:24px;font-weight:800;margin:0 auto 10px auto;padding:12px 18px;display:inline-block;">${escapeHtml(block.code)}</p>${block.expiresAt ? `<p style="font-size:13px;color:#64748B;margin:0;">優惠截止：${escapeHtml(formatTaipeiDate(block.expiresAt))}</p>` : ""}</td></tr></table>`;
		case "course":
		case "bundle": {
			const href = withUtmParams(joinUrl(context.appUrl, block.url), {
				campaign: context.campaignSlug,
				content: context.utmContent ?? `${block.type}-card`,
			});
			return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #E2E8F0;border-radius:12px;margin:24px 0;background:#FFFFFF;"><tr><td style="padding:18px;">${block.imageUrl ? `<img src="${escapeAttr(block.imageUrl)}" alt="${escapeAttr(block.title)}" width="516" style="display:block;width:100%;max-width:516px;border-radius:10px;height:auto;margin-bottom:16px;">` : ""}<h2 style="font-size:20px;line-height:1.35;color:#0F172A;margin:0 0 10px 0;">${escapeHtml(block.title)}</h2><p style="font-size:28px;line-height:1.2;color:#EA580C;font-weight:800;margin:0 0 16px 0;">${escapeHtml(block.priceLabel)}</p><a href="${escapeAttr(href)}" style="display:inline-block;background:#EA580C;color:#FFFFFF;text-decoration:none;border-radius:8px;padding:15px 28px;font-weight:800;">查看詳情</a></td></tr></table>`;
		}
		case "countdown":
			return `<div style="margin:20px 0;padding:14px 16px;border-radius:10px;background:#FFF7ED;border:1px solid #FDBA74;color:#9A3412;font-size:15px;font-weight:700;text-align:center;">${escapeHtml(block.text)}</div>`;
		default:
			return "";
	}
}

export function assertPromoAudienceLocked(input: {
	type: "GENERAL" | "PROMO";
	segment: SegmentJson;
}): { ok: true; segment: SegmentJson } {
	if (input.type !== "PROMO") {
		return { ok: true, segment: input.segment };
	}

	if (!segmentHasMarketingConsentLock(input.segment)) {
		throw new PromoAudienceLockError();
	}

	return { ok: true, segment: input.segment };
}

export type PromoAudienceUiState = {
	forceMarketingConsent: true;
	disabledPresets: Array<NonNullable<SegmentJson["preset"]>>;
	lockedRule: SegmentRule;
	canEditMarketingConsentRule: false;
	/** Apply before saving / estimating so UI and API stay aligned. */
	applyLock: (segment: SegmentJson) => SegmentJson;
};

export function getPromoAudienceUiState(
	type: "GENERAL" | "PROMO",
): PromoAudienceUiState | { forceMarketingConsent: false } {
	if (type !== "PROMO") {
		return { forceMarketingConsent: false };
	}

	return {
		forceMarketingConsent: true,
		disabledPresets: ["all", "paidStudents", "freeStudents"],
		lockedRule: { field: "marketingConsent", value: true },
		canEditMarketingConsentRule: false,
		applyLock: enforcePromoAudienceSegment,
	};
}

export { PromoAudienceLockError, enforcePromoAudienceSegment, segmentHasMarketingConsentLock };
