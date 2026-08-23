import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { EXIT, visit } from "unist-util-visit";

import { BLOCK_REGISTRY, isRegisteredBlockName } from "./block-registry";

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

type EstreeNode = {
	type: string;
	argument?: EstreeNode;
	body?: EstreeNode[] | EstreeNode;
	computed?: boolean;
	elements?: Array<EstreeNode | null>;
	expression?: EstreeNode;
	expressions?: EstreeNode[];
	key?: EstreeNode;
	kind?: string;
	method?: boolean;
	name?: string;
	operator?: string;
	properties?: EstreeNode[];
	value?: EstreeNode;
	quasis?: Array<{ value?: { cooked?: string; raw?: string } }>;
};

function isSafeDataEstree(node: EstreeNode | null | undefined): boolean {
	if (!node) {
		return false;
	}

		switch (node.type) {
		case "Program":
			return Array.isArray(node.body) && node.body.length === 1 && isSafeDataEstree(node.body[0]);

		case "ExpressionStatement":
			return isSafeDataEstree(node.expression);

		case "Literal":
			return (
				node.value === null ||
				typeof node.value === "string" ||
				typeof node.value === "number" ||
				typeof node.value === "boolean"
			);

		case "TemplateLiteral":
			return Array.isArray(node.expressions) && node.expressions.length === 0;

		case "UnaryExpression":
			return (node.operator === "+" || node.operator === "-") && isSafeDataEstree(node.argument);

		case "ArrayExpression":
			return (node.elements ?? []).every((element) => element == null || isSafeDataEstree(element));

		case "ObjectExpression":
			return (node.properties ?? []).every((property) => {
				if (property.type !== "Property" || property.computed || property.method || property.kind !== "init") {
					return false;
				}

				const keyIsSafe =
					property.key?.type === "Identifier" || isSafeDataEstree(property.key);

				return keyIsSafe && isSafeDataEstree(property.value);
			});

		default:
			return false;
	}
}

function estreeToJson(node: EstreeNode): unknown {
	switch (node.type) {
		case "Program":
			return Array.isArray(node.body) && node.body[0] ? estreeToJson(node.body[0]) : undefined;

		case "ExpressionStatement":
			return node.expression ? estreeToJson(node.expression) : undefined;

		case "Literal":
			return node.value;

		case "TemplateLiteral":
			return node.quasis?.[0]?.value?.cooked ?? node.quasis?.[0]?.value?.raw ?? "";

		case "UnaryExpression": {
			const value = estreeToJson(node.argument as EstreeNode);
			return node.operator === "-" && typeof value === "number" ? -value : value;
		}

		case "ArrayExpression":
			return (node.elements ?? []).map((element) => (element ? estreeToJson(element) : null));

		case "ObjectExpression": {
			const result: Record<string, unknown> = {};
			for (const property of node.properties ?? []) {
				if (property.type !== "Property" || !property.value) {
					continue;
				}
				const key = property.key?.name ?? estreeToJson(property.key as EstreeNode);
				if (typeof key === "string") {
					result[key] = estreeToJson(property.value);
				}
			}
			return result;
		}

		default:
			return undefined;
	}
}

function isSafeAttributeExpression(value: {
	data?: { estree?: EstreeNode };
	value?: string;
}): boolean {
	if (value.data?.estree) {
		return isSafeDataEstree(value.data.estree);
	}

	const raw = value.value?.trim() ?? "";

	if (!raw) {
		return false;
	}

	try {
		JSON.parse(raw);

		return true;
	} catch {
		return false;
	}
}

function inspectJsxAttributes(attributes: unknown): MdxInspectResult | null {
	if (!Array.isArray(attributes)) {
		return null;
	}

	for (const attribute of attributes) {
		if (!attribute || typeof attribute !== "object" || !("type" in attribute)) {
			continue;
		}

		if (attribute.type === "mdxJsxExpressionAttribute") {
			return { ok: false, error: "講義內容不允許 JavaScript 表達式。" };
		}

		if (attribute.type !== "mdxJsxAttribute") {
			continue;
		}

		const name = "name" in attribute && typeof attribute.name === "string" ? attribute.name : "";

		if (/^on[A-Z]/.test(name) || name === "dangerouslySetInnerHTML") {
			return { ok: false, error: "講義內容不允許事件處理或危險屬性。" };
		}

		const value = "value" in attribute ? attribute.value : null;

		if (value && typeof value === "object" && "type" in value && value.type === "mdxJsxAttributeValueExpression") {
			if (!isSafeAttributeExpression(value as { data?: { estree?: EstreeNode }; value?: string })) {
				return { ok: false, error: "講義內容不允許 JavaScript 表達式。" };
			}
		}
	}

	return null;
}

function validateJsxAttributes(name: string, attributes: unknown): MdxInspectResult | null {
	const definition = BLOCK_REGISTRY.find((block) => block.name === name);
	if (!definition || !Array.isArray(attributes)) {
		return null;
	}

	const props: Record<string, unknown> = {};
	for (const attribute of attributes) {
		if (!attribute || typeof attribute !== "object" || !("type" in attribute)) {
			continue;
		}
		if (attribute.type !== "mdxJsxAttribute") {
			continue;
		}

		const attributeName = "name" in attribute && typeof attribute.name === "string" ? attribute.name : "";
		const value = "value" in attribute ? attribute.value : null;
		if (!attributeName) {
			continue;
		}
		if (!value) {
			props[attributeName] = true;
			continue;
		}
		if (typeof value === "string") {
			props[attributeName] = value;
			continue;
		}
		if (
			typeof value === "object" &&
			"type" in value &&
			value.type === "mdxJsxAttributeValueExpression" &&
			"data" in value &&
			value.data &&
			typeof value.data === "object" &&
			"estree" in value.data &&
			value.data.estree &&
			isSafeDataEstree(value.data.estree as EstreeNode)
		) {
			props[attributeName] = estreeToJson(value.data.estree as EstreeNode);
		}
	}

	if (!definition.propsSchema.safeParse(props).success) {
		return { ok: false, error: `講義內容積木參數不符合規格：${name}` };
	}

	return null;
}

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

	if (!isRegisteredBlockName(name)) {
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

		if (!name || !isRegisteredBlockName(name)) {
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

			const attributeResult = inspectJsxAttributes(
				"attributes" in node ? node.attributes : undefined,
			);

			if (attributeResult) {
				astResult = attributeResult;

				return EXIT;
			}

			const propsResult = validateJsxAttributes(name ?? "", "attributes" in node ? node.attributes : undefined);
			if (propsResult) {
				astResult = propsResult;

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
