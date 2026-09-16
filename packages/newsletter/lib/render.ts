import { sanitizeEmailHtml } from "@startkiter/mail";

import {
	bindCountdownBlock,
	bindCouponBlock,
	bindCourseCardBlock,
	renderPromoBlockHtml,
	type CatalogCourse,
	type CouponRecord,
	type PromoNewsletterBlock,
} from "./promo-blocks";

const MAX_EMAIL_HTML_BYTES = 102 * 1024;

type BaseBlock =
	| { type: "heading"; props?: { level?: number }; content: string }
	| { type: "paragraph"; content: string }
	| { type: "image"; props: { src: string; alt?: string }; content?: string }
	| { type: "button"; props: { text: string; url: string }; content?: string }
	| { type: "divider"; content?: string }
	| { type: "video"; props: { title: string; url: string; thumbnailUrl?: string }; content?: string };

type PromoContentBlock =
	| {
			type: "coupon";
			props: {
				couponId: string;
				code: string;
				codeReadOnly?: true;
				description?: string;
				expiresAt?: string;
			};
			content?: string;
	  }
	| {
			type: "course";
			props: {
				courseId: string;
				title: string;
				imageUrl?: string;
				priceLabel: string;
				priceReadOnly?: true;
				url: string;
				urlReadOnly?: true;
			};
			content?: string;
	  }
	| {
			type: "countdown";
			props: { text?: string; expiresAt?: string };
			content?: string;
	  };

export type NewsletterContentBlock = BaseBlock | PromoContentBlock;

export type NewsletterContentJson = {
	blocks: NewsletterContentBlock[];
	meta?: {
		tags?: string[];
		campaignSlug?: string;
	};
};

export type RenderMode = "preview" | "test" | "send";

export type RenderCampaignOptions = {
	mode?: RenderMode;
	appUrl?: string;
	campaignSlug?: string;
	siteName?: string;
};

export type RenderCampaignResult = {
	html: string;
	text: string;
	sizeBytes: number;
	isOversized: boolean;
	warnings: string[];
};

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value);
}

function sanitizeInlineHtml(value: string): string {
	return sanitizeEmailHtml(value)
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<\/?script\b[^>]*>/gi, "");
}

function cell(inner: string): string {
	return `<tr><td style="padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;font-size:16px;line-height:1.6;">${inner}</td></tr>`;
}

function toPromoBlock(block: PromoContentBlock): PromoNewsletterBlock {
	if (block.type === "coupon") {
		return {
			id: block.props.couponId,
			type: "coupon",
			couponId: block.props.couponId,
			code: block.props.code,
			codeReadOnly: true,
			description: block.props.description,
			expiresAt: block.props.expiresAt,
		};
	}
	if (block.type === "course") {
		return {
			id: block.props.courseId,
			type: "course",
			courseId: block.props.courseId,
			title: block.props.title,
			imageUrl: block.props.imageUrl,
			priceLabel: block.props.priceLabel,
			priceReadOnly: true,
			url: block.props.url,
			urlReadOnly: true,
		};
	}
	return {
		id: "countdown",
		type: "countdown",
		text: block.props.text || bindCountdownBlock(block.props.expiresAt || new Date().toISOString()).text,
		expiresAt: block.props.expiresAt,
	};
}

function renderBaseBlock(block: BaseBlock): string {
	switch (block.type) {
		case "heading": {
			const level = Math.min(Math.max(block.props?.level ?? 1, 1), 3);
			const size = level === 1 ? 28 : level === 2 ? 22 : 18;
			return cell(
				`<h${level} style="margin:0;font-size:${size}px;line-height:1.3;color:#0F172A;">${escapeHtml(sanitizeInlineHtml(block.content))}</h${level}>`,
			);
		}
		case "paragraph":
			return cell(`<p style="margin:0;">${escapeHtml(sanitizeInlineHtml(block.content))}</p>`);
		case "image":
			return cell(
				`<img src="${escapeAttr(block.props.src)}" alt="${escapeAttr(block.props.alt || "")}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;">`,
			);
		case "button":
			return cell(
				`<a href="${escapeAttr(block.props.url)}" style="display:inline-block;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:8px;padding:12px 20px;font-weight:700;">${escapeHtml(block.props.text)}</a>`,
			);
		case "divider":
			return cell('<hr style="border:none;border-top:1px solid #E2E8F0;margin:8px 0;">');
		case "video":
			return cell(
				`<p style="margin:0 0 8px 0;font-weight:700;">${escapeHtml(block.props.title)}</p><a href="${escapeAttr(block.props.url)}" style="color:#2563EB;">觀看影片</a>`,
			);
		default:
			return "";
	}
}

function blockToText(block: NewsletterContentBlock): string[] {
	switch (block.type) {
		case "heading":
		case "paragraph":
			return [sanitizeInlineHtml(block.content)];
		case "button":
			return [`${block.props.text} [${block.props.url}]`];
		case "image":
			return block.props.alt ? [`[圖片] ${block.props.alt}`] : [];
		case "video":
			return [`${block.props.title} [${block.props.url}]`];
		case "coupon":
			return [`優惠碼：${block.props.code}`];
		case "course":
			return [`${block.props.title} ${block.props.priceLabel} [${block.props.url}]`];
		case "countdown":
			return [block.props.text || `優惠倒數至 ${block.props.expiresAt || ""}`];
		default:
			return [];
	}
}

export function renderCampaignHtml(
	content: NewsletterContentJson,
	options: RenderCampaignOptions = {},
): RenderCampaignResult {
	const mode = options.mode ?? "preview";
	const appUrl = options.appUrl ?? "https://app.startkiter.dev";
	const campaignSlug = options.campaignSlug ?? content.meta?.campaignSlug ?? "newsletter";
	const siteName = options.siteName ?? "StartKiter";

	const testBanner =
		mode === "test"
			? `<tr data-newsletter-test-banner="true"><td style="padding:10px 24px;background:#FEF3C7;color:#92400E;text-align:center;font-weight:700;font-size:14px;">這是測試信</td></tr>`
			: "";

	const bodyRows = (content.blocks || [])
		.map((block) => {
			if (block.type === "coupon" || block.type === "course" || block.type === "countdown") {
				return cell(
					renderPromoBlockHtml(toPromoBlock(block), {
						appUrl,
						campaignSlug,
						utmContent: block.type === "course" ? "course-card" : block.type,
					}),
				);
			}
			return renderBaseBlock(block);
		})
		.join("");

	const html = sanitizeEmailHtml(
		`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escapeHtml(siteName)}</title></head><body style="margin:0;padding:20px;background:#F5F5F5;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FFFFFF;border:1px solid #E2E8F0;">${testBanner}${bodyRows}</table></td></tr></table></body></html>`,
	);
	const text = (content.blocks || []).flatMap(blockToText).join("\n\n").trim();
	const sizeBytes = Buffer.byteLength(html, "utf8");
	const warnings: string[] = [];
	const isOversized = sizeBytes > MAX_EMAIL_HTML_BYTES;
	if (isOversized) {
		warnings.push(`HTML exceeds 102KB (${sizeBytes} bytes)`);
	}

	return { html, text, sizeBytes, isOversized, warnings };
}

/** Helpers Wave 2D exposes for promo block construction against catalog/coupon records. */
export function createPromoCouponBlock(coupon: CouponRecord): PromoContentBlock {
	const bound = bindCouponBlock(coupon);
	return {
		type: "coupon",
		props: {
			couponId: bound.couponId,
			code: bound.code,
			codeReadOnly: true,
			expiresAt: bound.expiresAt,
		},
	};
}

export function createPromoCourseBlock(course: CatalogCourse): PromoContentBlock {
	const bound = bindCourseCardBlock(course);
	return {
		type: "course",
		props: {
			courseId: bound.courseId,
			title: bound.title,
			imageUrl: bound.imageUrl,
			priceLabel: bound.priceLabel,
			priceReadOnly: true,
			url: bound.url,
			urlReadOnly: true,
		},
	};
}

export function createPromoCountdownBlock(expiresAt: Date | string): PromoContentBlock {
	const bound = bindCountdownBlock(expiresAt);
	return {
		type: "countdown",
		props: {
			text: bound.text,
			expiresAt: bound.expiresAt,
		},
	};
}
