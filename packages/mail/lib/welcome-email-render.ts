/** 歡迎信 BlockNote 區塊 → email 相容 HTML／純文字（參照 realms sanitize／size 手法重寫） */

export const MAX_WELCOME_EMAIL_HTML_BYTES = 256 * 1024;

const DEFAULT_BRAND_COLOR = "#365314";

export type WelcomeEmailRenderContext = {
	userName: string;
	courseName: string;
	courseUrl: string;
	brandColor?: string;
	subject?: string;
};

type InlineNode = {
	type?: string;
	text?: string;
	href?: string;
	styles?: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; code?: boolean };
	content?: InlineNode[];
};

type WelcomeBlock = {
	id?: string;
	type?: string;
	props?: Record<string, unknown>;
	content?: InlineNode[] | string;
	children?: WelcomeBlock[];
};

const TEMPLATE_VARIABLES = ["userName", "courseName", "courseUrl"] as const;

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

function safeTemplateValue(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/[\[\]()*_`#<>]/g, "\\$&");
}

function interpolateTemplate(source: string, values: Record<(typeof TEMPLATE_VARIABLES)[number], string>): string {
	return TEMPLATE_VARIABLES.reduce(
		(result, variable) => result.split(`{{${variable}}}`).join(safeTemplateValue(values[variable])),
		source,
	);
}

function sanitizeUrl(raw: string, appUrl?: string): string {
	try {
		const value = raw.trim();
		if (!value) return "#";
		if (value.startsWith("/")) {
			return appUrl ? new URL(value, appUrl).toString() : value;
		}
		if (value.toLowerCase().startsWith("data:") || value.toLowerCase().startsWith("javascript:")) {
			return "#";
		}
		const url = new URL(value);
		if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "mailto:") {
			return "#";
		}
		return url.toString();
	} catch {
		return "#";
	}
}

/** 正則消毒：移除 script／事件屬性／javascript:／data: URL（對齊 realms 手法並加強） */
export function sanitizeEmailHtml(html: string): string {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
		.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
		.replace(/<form[\s\S]*?>[\s\S]*?<\/form>/gi, "")
		.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
		.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
		.replace(/\shref\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, ' href="#"')
		.replace(/\ssrc\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, ' src=""')
		.replace(/\shref\s*=\s*(['"])\s*data:[\s\S]*?\1/gi, ' href="#"')
		.replace(/\ssrc\s*=\s*(['"])\s*data:[\s\S]*?\1/gi, ' src=""')
		.replace(/onerror/gi, "")
		.replace(/<script/gi, "");
}

export function assertHtmlSize(html: string): { ok: boolean; bytes: number } {
	const bytes = Buffer.byteLength(html, "utf8");
	return { ok: bytes <= MAX_WELCOME_EMAIL_HTML_BYTES, bytes };
}

function stripDangerousMarkup(text: string): string {
	return text
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/<\/?[a-z][^>]*>/gi, "")
		.replace(/onerror/gi, "");
}

function renderInline(content: WelcomeBlock["content"]): string {
	if (typeof content === "string") {
		return escapeHtml(stripDangerousMarkup(content));
	}
	if (!Array.isArray(content)) return "";

	return content
		.map((node) => {
			if (!node || typeof node !== "object") return "";
			if (node.type === "link") {
				const href = sanitizeUrl(String(node.href || "#"));
				const label = renderInline(node.content);
				return `<a href="${escapeAttr(href)}" style="color:#365314;text-decoration:underline;">${label}</a>`;
			}
			if (node.type === "text" || node.text) {
				let html = escapeHtml(stripDangerousMarkup(node.text || ""));
				const styles = node.styles || {};
				if (styles.code) html = `<code style="font-family:ui-monospace,monospace;background:#F1F5F9;padding:1px 4px;border-radius:4px;">${html}</code>`;
				if (styles.bold) html = `<strong>${html}</strong>`;
				if (styles.italic) html = `<em>${html}</em>`;
				if (styles.underline) html = `<u>${html}</u>`;
				if (styles.strike) html = `<s>${html}</s>`;
				return html;
			}
			return "";
		})
		.join("");
}

function plainInline(content: WelcomeBlock["content"]): string {
	if (typeof content === "string") return stripDangerousMarkup(content);
	if (!Array.isArray(content)) return "";
	return content
		.map((node) => {
			if (!node || typeof node !== "object") return "";
			if (node.type === "link") {
				const label = plainInline(node.content);
				const href = sanitizeUrl(String(node.href || "#"));
				return `${label} (${href})`;
			}
			if (node.type === "text" || node.text) return stripDangerousMarkup(node.text || "");
			return "";
		})
		.join("");
}

function parseBlocks(contentJson: string): WelcomeBlock[] {
	try {
		const parsed = JSON.parse(contentJson) as unknown;
		if (Array.isArray(parsed)) return parsed as WelcomeBlock[];
		if (parsed && typeof parsed === "object" && Array.isArray((parsed as { blocks?: unknown }).blocks)) {
			return (parsed as { blocks: WelcomeBlock[] }).blocks;
		}
		return [];
	} catch {
		return [];
	}
}

function blockHtml(block: WelcomeBlock, brandColor: string, appUrl: string): string {
	const type = block.type || "";
	const props = block.props || {};

	switch (type) {
		case "heading": {
			const level = Number(props.level) || 1;
			const tag = level >= 3 ? "h3" : level === 2 ? "h2" : "h1";
			const size = tag === "h1" ? "28px" : tag === "h2" ? "22px" : "18px";
			return `<${tag} style="font-size:${size};line-height:1.3;color:#0F172A;margin:0 0 20px 0;font-weight:700;">${renderInline(block.content)}</${tag}>`;
		}
		case "paragraph":
			return `<p style="font-size:16px;line-height:1.7;color:#334155;margin:0 0 18px 0;">${renderInline(block.content)}</p>`;
		case "quote":
			return `<blockquote style="border-left:4px solid ${brandColor};margin:24px 0;padding:4px 0 4px 18px;color:#475569;font-size:17px;line-height:1.7;">${renderInline(block.content)}</blockquote>`;
		case "bulletListItem":
			return `<ul style="margin:0 0 18px 0;padding-left:22px;color:#334155;font-size:16px;line-height:1.7;"><li>${renderInline(block.content)}</li></ul>`;
		case "numberedListItem":
			return `<ol style="margin:0 0 18px 0;padding-left:22px;color:#334155;font-size:16px;line-height:1.7;"><li>${renderInline(block.content)}</li></ol>`;
		case "ctaButton":
		case "newsletterButton": {
			const text = escapeHtml(stripDangerousMarkup(String(props.text || "點擊前往")));
			const url = escapeAttr(sanitizeUrl(String(props.url || "/"), appUrl));
			return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px auto;"><tr><td align="center" style="border-radius:8px;background:${brandColor};"><a href="${url}" style="display:inline-block;background:${brandColor};color:#FFFFFF;text-decoration:none;border-radius:8px;padding:14px 28px;font-size:16px;font-weight:700;">${text}</a></td></tr></table>`;
		}
		default:
			return "";
	}
}

function blockText(block: WelcomeBlock, appUrl: string): string[] {
	const type = block.type || "";
	const props = block.props || {};

	switch (type) {
		case "heading":
		case "paragraph":
		case "quote":
		case "bulletListItem":
		case "numberedListItem":
			return [plainInline(block.content)].filter(Boolean);
		case "ctaButton":
		case "newsletterButton": {
			const text = stripDangerousMarkup(String(props.text || "點擊前往"));
			const url = sanitizeUrl(String(props.url || "/"), appUrl);
			return [`${text} (${url})`];
		}
		default:
			return [];
	}
}

/** 把區塊 JSON 匯出為純文字（給 markdownTemplate fallback 用） */
export function blocksToPlainText(contentJson: string, appUrl = ""): string {
	const blocks = parseBlocks(contentJson);
	const lines: string[] = [];
	for (const block of blocks) {
		lines.push(...blockText(block, appUrl));
		if (Array.isArray(block.children) && block.children.length) {
			for (const child of block.children) {
				lines.push(...blockText(child, appUrl));
			}
		}
	}
	return lines.filter(Boolean).join("\n\n");
}

export async function renderWelcomeEmailFromBlocks(
	contentJson: string,
	context: WelcomeEmailRenderContext,
): Promise<{ html: string; text: string }> {
	const brandColor = context.brandColor || DEFAULT_BRAND_COLOR;
	const appUrl = context.courseUrl ? new URL(context.courseUrl).origin : "";
	const blocks = parseBlocks(contentJson);

	const bodyParts: string[] = [];
	const textParts: string[] = [];

	for (const block of blocks) {
		bodyParts.push(blockHtml(block, brandColor, appUrl));
		textParts.push(...blockText(block, appUrl));
		if (Array.isArray(block.children)) {
			for (const child of block.children) {
				bodyParts.push(blockHtml(child, brandColor, appUrl));
				textParts.push(...blockText(child, appUrl));
			}
		}
	}

	const title = escapeHtml(context.subject || context.courseName || "Welcome");
	const html = sanitizeEmailHtml(
		`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head><body style="margin:0;padding:20px;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;"><tr><td style="padding:28px 24px;">${bodyParts.join("") || '<p style="font-size:16px;color:#64748B;">（空白歡迎信）</p>'}</td></tr></table></td></tr></table></body></html>`,
	);

	const size = assertHtmlSize(html);
	if (!size.ok) {
		throw new Error(`Rendered email exceeds the size limit of 256KB (${size.bytes} bytes)`);
	}

	const values = {
		userName: context.userName,
		courseName: context.courseName,
		courseUrl: context.courseUrl,
	};

	return {
		html: interpolateTemplate(html, values),
		text: interpolateTemplate(textParts.filter(Boolean).join("\n\n"), values),
	};
}
