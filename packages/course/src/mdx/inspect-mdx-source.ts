import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { EXIT, visit } from "unist-util-visit";

import { LESSON_MDX_COMPONENT_SET } from "./allowed-components";

export type MdxInspectResult =
	| { ok: true }
	| { ok: false; error: string };

const FORBIDDEN_HTML_NAMES = new Set([
	"script",
	"iframe",
	"object",
	"embed",
	"form",
	"link",
	"meta",
	"style",
	"html",
	"body",
	"head",
	"svg",
	"math",
	"base",
]);

const FORBIDDEN_HTML_TAG =
	/<\/?(script|iframe|object|embed|form|link|meta|style|html|body|head|svg|math|base)\b/i;

const LOWERCASE_HTML_TAG = /<\/?([a-z][a-z0-9]*)\b/g;

const JSX_COMPONENT = /<([A-Z][A-Za-z0-9]*)\b/g;

const EXPRESSION_NODE_TYPES = new Set([
	"mdxFlowExpression",
	"mdxTextExpression",
]);

function inspectJsxTagName(name: string | null | undefined): MdxInspectResult | null {
	if (name == null) {
		return null;
	}

	const lower = name.toLowerCase();

	if (FORBIDDEN_HTML_NAMES.has(lower)) {
		return { ok: false, error: "講義內容含有不允許的 HTML。" };
	}

	if (!/^[A-Z]/.test(name)) {
		return { ok: false, error: "講義內容不允許原始 HTML。" };
	}

	if (!LESSON_MDX_COMPONENT_SET.has(name)) {
		return { ok: false, error: `講義內容含有未授權元件：${name}` };
	}

	return null;
}

function inspectRegexFallback(source: string): MdxInspectResult | null {
	if (FORBIDDEN_HTML_TAG.test(source) || /<script[\s>]/i.test(source)) {
		return { ok: false, error: "講義內容含有不允許的 HTML。" };
	}

	LOWERCASE_HTML_TAG.lastIndex = 0;

	const htmlTag = LOWERCASE_HTML_TAG.exec(source);

	if (htmlTag) {
		return { ok: false, error: "講義內容不允許原始 HTML。" };
	}

	JSX_COMPONENT.lastIndex = 0;

	let match: RegExpExecArray | null = JSX_COMPONENT.exec(source);

	while (match) {
		const name = match[1];

		if (!name || !LESSON_MDX_COMPONENT_SET.has(name)) {
			return { ok: false, error: `講義內容含有未授權元件：${name ?? "unknown"}` };
		}

		match = JSX_COMPONENT.exec(source);
	}

	return null;
}

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

	let tree;

	try {
		tree = fromMarkdown(trimmed, {
			extensions: [mdxjs()],
			mdastExtensions: [mdxFromMarkdown()],
		});
	} catch {
		return { ok: false, error: "講義內容無法解析。" };
	}

	let astResult: MdxInspectResult | null = null;

	visit(tree, (node) => {
		if (EXPRESSION_NODE_TYPES.has(node.type)) {
			astResult = { ok: false, error: "講義內容不允許 JavaScript 表達式。" };

			return EXIT;
		}

		if (node.type === "mdxjsEsm") {
			astResult = { ok: false, error: "講義內容不允許 import 或 export。" };

			return EXIT;
		}

		if (node.type === "html") {
			astResult = { ok: false, error: "講義內容不允許原始 HTML。" };

			return EXIT;
		}

		if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
			const name = "name" in node ? (node.name as string | null) : undefined;
			const jsxResult = inspectJsxTagName(name);

			if (jsxResult) {
				astResult = jsxResult;

				return EXIT;
			}
		}

		return undefined;
	});

	if (astResult) {
		return astResult;
	}

	const regexResult = inspectRegexFallback(trimmed);

	if (regexResult) {
		return regexResult;
	}

	return { ok: true };
}
