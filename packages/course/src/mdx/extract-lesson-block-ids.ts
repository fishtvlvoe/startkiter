import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { visit } from "unist-util-visit";

type MdxJsxAttributeValueExpression = {
	type: "mdxJsxAttributeValueExpression";
	value?: string;
};

type MdxJsxAttribute = {
	type: "mdxJsxAttribute";
	name: string;
	value?: string | MdxJsxAttributeValueExpression | null;
};

function readBlockId(attribute: MdxJsxAttribute): string | null {
	if (attribute.name !== "blockId" || attribute.value == null) {
		return null;
	}

	if (typeof attribute.value === "string") {
		const trimmed = attribute.value.trim();

		return trimmed ? trimmed : null;
	}

	if (attribute.value.type !== "mdxJsxAttributeValueExpression") {
		return null;
	}

	const expression = attribute.value.value?.trim() ?? "";
	const quoted = expression.match(/^(['"])(.*)\1$/);

	if (quoted?.[2]?.trim()) {
		return quoted[2].trim();
	}

	return null;
}

export function extractLessonBlockIds(source: string): string[] {
	const trimmed = source.trim();

	if (!trimmed) {
		return [];
	}

	let tree;

	try {
		tree = fromMarkdown(trimmed, {
			extensions: [mdxjs()],
			mdastExtensions: [mdxFromMarkdown()],
		});
	} catch {
		return [];
	}

	const blockIds: string[] = [];
	const seen = new Set<string>();

	visit(tree, (node) => {
		if (node.type !== "mdxJsxFlowElement" && node.type !== "mdxJsxTextElement") {
			return;
		}

		const attributes = "attributes" in node ? (node.attributes as unknown[]) : [];

		for (const attribute of attributes) {
			if (!attribute || typeof attribute !== "object" || !("type" in attribute)) {
				continue;
			}

			if ((attribute as MdxJsxAttribute).type !== "mdxJsxAttribute") {
				continue;
			}

			const blockId = readBlockId(attribute as MdxJsxAttribute);

			if (!blockId || seen.has(blockId)) {
				continue;
			}

			seen.add(blockId);
			blockIds.push(blockId);
		}
	});

	return blockIds;
}
