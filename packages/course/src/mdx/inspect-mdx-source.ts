import { LESSON_MDX_COMPONENT_SET } from "./allowed-components";

export type MdxInspectResult =
	| { ok: true }
	| { ok: false; error: string };

const FORBIDDEN_HTML_TAG =
	/<\/?(script|iframe|object|embed|form|link|meta|style|html|body|head|svg|math|base|object)\b/i;

const LOWERCASE_HTML_TAG = /<\/?([a-z][a-z0-9]*)\b/g;

const JSX_COMPONENT = /<([A-Z][A-Za-z0-9]*)\b/g;

export function inspectMdxSource(source: string): MdxInspectResult {
	const trimmed = source.trim();

	if (!trimmed) {
		return { ok: true };
	}

	if (/javascript:/i.test(trimmed)) {
		return { ok: false, error: "講義內容含有不允許的連結協定。" };
	}

	if (/^\s*import\s/m.test(trimmed) || /^\s*export\s/m.test(trimmed)) {
		return { ok: false, error: "講義內容不允許 import 或 export。" };
	}

	if (FORBIDDEN_HTML_TAG.test(trimmed) || /<script[\s>]/i.test(trimmed)) {
		return { ok: false, error: "講義內容含有不允許的 HTML。" };
	}

	LOWERCASE_HTML_TAG.lastIndex = 0;

	const htmlTag = LOWERCASE_HTML_TAG.exec(trimmed);

	if (htmlTag) {
		return { ok: false, error: "講義內容不允許原始 HTML。" };
	}

	JSX_COMPONENT.lastIndex = 0;

	let match: RegExpExecArray | null = JSX_COMPONENT.exec(trimmed);

	while (match) {
		const name = match[1];

		if (!name || !LESSON_MDX_COMPONENT_SET.has(name)) {
			return { ok: false, error: `講義內容含有未授權元件：${name ?? "unknown"}` };
		}

		match = JSX_COMPONENT.exec(trimmed);
	}

	return { ok: true };
}
