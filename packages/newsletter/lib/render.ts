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
import { NewsletterComplianceError } from "./compliance";
import { createUnsubscribeToken } from "./unsubscribe-token";
import type { UnsubscribeScope } from "./email-consent";

export const MAX_CAMPAIGN_HTML_BYTES = 102 * 1024;
const DEFAULT_SENDER_PHYSICAL_ADDRESS = "台北市信義區市府路 1 號";

export type NewsletterInlineStyles = {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strike?: boolean;
	code?: boolean;
};

export type NewsletterInlineNode = {
	type?: "text" | "link" | string;
	text?: string;
	href?: string;
	styles?: NewsletterInlineStyles;
	content?: NewsletterInlineNode[];
};

export type NewsletterBlockContent = string | NewsletterInlineNode[];

export type NewsletterHeadingBlock = { type: "heading"; props?: { level?: number }; content: NewsletterBlockContent };
export type NewsletterParagraphBlock = { type: "paragraph"; content: NewsletterBlockContent };
export type NewsletterImageBlock = { type: "image"; props: { src: string; alt?: string; href?: string; width?: number | string }; content?: NewsletterBlockContent };
export type NewsletterButtonBlock = { type: "button"; props: { text: string; url: string }; content?: NewsletterBlockContent };
export type NewsletterDividerBlock = { type: "divider"; props?: { color?: string }; content?: NewsletterBlockContent };
export type NewsletterVideoCardBlock = { type: "video" | "videoCard"; props: { title: string; url: string; thumbnailUrl?: string; description?: string }; content?: NewsletterBlockContent };

type BaseBlock = NewsletterHeadingBlock | NewsletterParagraphBlock | NewsletterImageBlock | NewsletterButtonBlock | NewsletterDividerBlock | NewsletterVideoCardBlock;

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

export type CampaignRenderMode = "preview" | "test" | "send";
export type RenderMode = CampaignRenderMode;

export type RenderCampaignOptions = {
	mode?: CampaignRenderMode;
	appUrl?: string;
	baseUrl?: string;
	campaignSlug?: string;
	siteName?: string;
	testBanner?: string;
	mergeValues?: Record<string, string>;
	recipientUserId?: string;
	recipientEmail?: string;
	unsubscribeScope?: UnsubscribeScope;
	senderPhysicalAddress?: string;
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
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/`/g, "&#96;");
}

/** Existing mail sanitizer is the server-side boundary; remove tags before escaping editor text. */
function sanitizeInlineText(value: string): string {
	return sanitizeEmailHtml(value).replace(/<[^>]*>/g, "");
}

function inlineHtml(content: NewsletterBlockContent): string {
	if (typeof content === "string") return escapeHtml(sanitizeInlineText(content));

	return content
		.map((node) => {
			const value = escapeHtml(sanitizeInlineText(node.text || ""));
			if (node.type === "link") {
				return `<a href="${escapeAttr(node.href || "#")}" style="color:#2563EB;text-decoration:underline;">${value}</a>`;
			}
			let result = value;
			if (node.styles?.code) result = `<code style="font-family:monospace;background:#F1F5F9;padding:1px 4px;">${result}</code>`;
			if (node.styles?.bold) result = `<strong>${result}</strong>`;
			if (node.styles?.italic) result = `<em>${result}</em>`;
			if (node.styles?.underline) result = `<u>${result}</u>`;
			if (node.styles?.strike) result = `<s>${result}</s>`;
			return result;
		})
		.join("");
}

function inlineText(content: NewsletterBlockContent): string {
	if (typeof content === "string") return sanitizeInlineText(content);
	return content
		.map((node) => node.type === "link" ? `${sanitizeInlineText(node.text || "")} [${node.href || "#"}]` : sanitizeInlineText(node.text || ""))
		.join("");
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
				`<h${level} style="margin:0;font-size:${size}px;line-height:1.3;color:#0F172A;">${inlineHtml(block.content)}</h${level}>`,
			);
		}
		case "paragraph":
			return cell(`<p style="margin:0;">${inlineHtml(block.content)}</p>`);
		case "image": {
			const image = `<img src="${escapeAttr(block.props.src)}" alt="${escapeAttr(sanitizeInlineText(block.props.alt || ""))}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;">`;
			return cell(block.props.href ? `<a href="${escapeAttr(block.props.href)}" style="text-decoration:none;">${image}</a>` : image);
		}
		case "button":
			return cell(
				`<a href="${escapeAttr(block.props.url)}" style="display:inline-block;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:8px;padding:12px 20px;font-weight:700;">${escapeHtml(sanitizeInlineText(block.props.text))}</a>`,
			);
		case "divider":
			return cell(`<hr style="border:none;border-top:1px solid ${escapeAttr(block.props?.color || "#E2E8F0")};margin:8px 0;">`);
		case "video":
		case "videoCard": {
			const thumbnail = block.props.thumbnailUrl
				? `<img src="${escapeAttr(block.props.thumbnailUrl)}" alt="${escapeAttr(sanitizeInlineText(block.props.title))}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;margin-bottom:12px;">`
				: "";
			const description = block.props.description ? `<p style="margin:8px 0;color:#475569;font-size:14px;">${escapeHtml(sanitizeInlineText(block.props.description))}</p>` : "";
			return cell(
				`${thumbnail}<p style="margin:0 0 8px 0;font-weight:700;">${escapeHtml(sanitizeInlineText(block.props.title))}</p>${description}<a href="${escapeAttr(block.props.url)}" style="color:#2563EB;">觀看影片</a>`,
			);
		}
		default:
			return "";
	}
}

function blockToText(block: NewsletterContentBlock): string[] {
	switch (block.type) {
		case "heading":
		case "paragraph":
			return [inlineText(block.content)];
		case "button":
			return [`${sanitizeInlineText(block.props.text)} [${block.props.url}]`];
		case "image":
			return block.props.alt ? [`[圖片] ${sanitizeInlineText(block.props.alt)}`] : [];
		case "video":
		case "videoCard":
			return [`${sanitizeInlineText(block.props.title)} [${block.props.url}]`];
		case "divider":
			return [];
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

function replaceMergeValues(source: string, values: Record<string, string> | undefined): string {
	if (!values) return source;
	return source.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, name: string) =>
		Object.prototype.hasOwnProperty.call(values, name) ? escapeHtml(sanitizeInlineText(String(values[name]))) : match,
	);
}

function resolveSenderPhysicalAddress(value: string | undefined): string {
	return value?.trim() || process.env.NEWSLETTER_SENDER_ADDRESS?.trim() || process.env.SUPPORT_ADDRESS?.trim() || "";
}

function buildUnsubscribeUrl(options: RenderCampaignOptions, appUrl: string): string | null {
	if (!options.recipientUserId || !options.recipientEmail) return null;
	const scope = options.unsubscribeScope ?? "all";
	const token = createUnsubscribeToken({
		userId: options.recipientUserId,
		email: options.recipientEmail,
		scope,
	});
	const unsubscribeUrl = new URL("/unsubscribe", appUrl);
	unsubscribeUrl.searchParams.set("userId", options.recipientUserId);
	unsubscribeUrl.searchParams.set("email", options.recipientEmail);
	unsubscribeUrl.searchParams.set("scope", scope);
	unsubscribeUrl.searchParams.set("token", token);
	return unsubscribeUrl.toString();
}

function renderFooter(options: RenderCampaignOptions, appUrl: string): { html: string; text: string } {
	const configuredAddress = resolveSenderPhysicalAddress(options.senderPhysicalAddress);
	if ((options.mode === "send" || options.mode === "test") && options.unsubscribeScope === "marketing" && !configuredAddress) {
		throw new NewsletterComplianceError();
	}

	const senderPhysicalAddress = configuredAddress || DEFAULT_SENDER_PHYSICAL_ADDRESS;
	const unsubscribeUrl = buildUnsubscribeUrl(options, appUrl);
	const addressText = senderPhysicalAddress;
	const unsubscribeHtml = unsubscribeUrl
		? `<a href="${escapeAttr(unsubscribeUrl)}" style="color:#64748B;text-decoration:underline;">取消訂閱</a>`
		: "";
	const html = cell(
		`<div role="contentinfo" style="color:#64748B;font-size:12px;line-height:1.5;text-align:center;"><p style="margin:0;">寄件人地址：${escapeHtml(sanitizeInlineText(addressText))}</p>${unsubscribeHtml ? `<p style="margin:8px 0 0;">${unsubscribeHtml}</p>` : ""}</div>`,
	);
	const text = `寄件人地址：${addressText}${unsubscribeUrl ? `\n取消訂閱：${unsubscribeUrl}` : ""}`;
	return { html, text };
}

export function htmlToPlainText(html: string): string {
	return sanitizeInlineText(html).replace(/\s+/g, " ").trim();
}

export function renderCampaignHtml(
	content: NewsletterContentJson,
	options: RenderCampaignOptions = {},
): RenderCampaignResult {
	const mode = options.mode ?? "preview";
	const appUrl = options.baseUrl ?? options.appUrl ?? "https://app.startkiter.dev";
	const campaignSlug = options.campaignSlug ?? content.meta?.campaignSlug ?? "newsletter";
	const siteName = options.siteName ?? "StartKiter";
	const footer = renderFooter(options, appUrl);

	const testBanner =
		mode === "test"
			? `<tr data-newsletter-test-banner="true"><td style="padding:10px 24px;background:#FEF3C7;color:#92400E;text-align:center;font-weight:700;font-size:14px;">${escapeHtml(options.testBanner ?? "這是測試信")}</td></tr>`
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

	const rawHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escapeHtml(siteName)}</title></head><body style="margin:0;padding:20px;background:#F5F5F5;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FFFFFF;border:1px solid #E2E8F0;">${testBanner}${bodyRows || cell('<p style="margin:0;">（空白電子報）</p>')}${footer.html}</table></td></tr></table></body></html>`;
	const html = sanitizeEmailHtml(replaceMergeValues(rawHtml, options.mergeValues));
	const text = htmlToPlainText(
		replaceMergeValues(`${(content.blocks || []).flatMap(blockToText).join("\n\n").trim() || "（空白電子報）"}\n\n${footer.text}`, options.mergeValues),
	) || "（空白電子報）";
	const sizeBytes = new TextEncoder().encode(html).byteLength;
	const warnings: string[] = [];
	const isOversized = sizeBytes > MAX_CAMPAIGN_HTML_BYTES;
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
