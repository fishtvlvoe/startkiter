import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

export const FORBIDDEN_TERMS = ["manifest", "resolver", "registry", "workspace context"] as const;

const SCANNED_EXTENSIONS = new Set([
	".css",
	".html",
	".htm",
	".js",
	".jsx",
	".json",
	".md",
	".mdx",
	".svelte",
	".ts",
	".tsx",
	".txt",
	".vue",
]);

export type ForbiddenTerm = (typeof FORBIDDEN_TERMS)[number];

export type ForbiddenTermMatch = {
	filePath: string;
	term: ForbiddenTerm;
	line: number;
	column: number;
	text: string;
};

type TextSegment = {
	start: number;
	text: string;
};

export function scanForbiddenTerms(root: string): ForbiddenTermMatch[] {
	const repositoryRoot = resolve(root);
	const matches: ForbiddenTermMatch[] = [];

	for (const target of ["apps/saas/modules", "docs/tutorials"]) {
		const targetPath = join(repositoryRoot, target);
		if (!existsSync(targetPath)) {
			continue;
		}

		for (const filePath of collectFiles(targetPath)) {
			const content = readFileSync(filePath, "utf8");
			const segments = isDocument(filePath)
				? extractDocumentText(content)
				: extractCodeText(content);

			for (const segment of segments) {
				for (const term of FORBIDDEN_TERMS) {
					for (const offset of findTermOffsets(segment.text, term)) {
						const absoluteOffset = segment.start + offset;
						matches.push({
							filePath: relative(repositoryRoot, filePath),
							term,
							line: getLine(content, absoluteOffset),
							column: getColumn(content, absoluteOffset),
							text: getLineText(content, absoluteOffset),
						});
					}
				}
			}
		}
	}

	return matches.sort((left, right) =>
		left.filePath.localeCompare(right.filePath) || left.line - right.line || left.column - right.column,
	);
}

export function formatForbiddenTermMatches(matches: ForbiddenTermMatch[]): string {
	return matches
		.map((match) => `${match.filePath}:${match.line}:${match.column} [${match.term}] ${match.text}`)
		.join("\n");
}

function collectFiles(directory: string): string[] {
	const files: string[] = [];

	for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
		left.name.localeCompare(right.name),
	)) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectFiles(path));
			continue;
		}
		if (
			entry.isFile() &&
			SCANNED_EXTENSIONS.has(extname(entry.name).toLowerCase()) &&
			!/(?:\.test|\.spec)\.[^.]+$/.test(entry.name)
		) {
			files.push(path);
		}
	}

	return files;
}

function isDocument(filePath: string): boolean {
	return new Set([".md", ".mdx", ".html", ".htm", ".txt"]).has(extname(filePath).toLowerCase());
}

function extractDocumentText(content: string): TextSegment[] {
	const segments: TextSegment[] = [];
	const contentWithoutHtmlComments = content.replace(/<!--[\s\S]*?-->/g, (comment) =>
		comment.replace(/[^\n]/g, " "),
	);
	let cursor = 0;
	let inCodeFence = false;

	for (const line of contentWithoutHtmlComments.split("\n")) {
		const lineStart = cursor;
		const trimmed = line.trimStart();
		if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
			inCodeFence = !inCodeFence;
		} else if (!inCodeFence) {
			segments.push({ start: lineStart, text: line });
		}
		cursor += line.length + 1;
	}

	return segments;
}

function extractCodeText(content: string): TextSegment[] {
	const segments: TextSegment[] = [];
	let index = 0;

	while (index < content.length) {
		const character = content[index];
		const next = content[index + 1];

		if (character === "/" && next === "/") {
			index = skipLineComment(content, index + 2);
			continue;
		}
		if (character === "/" && next === "*") {
			index = skipBlockComment(content, index + 2);
			continue;
		}
		if (character === "\"" || character === "'" || character === "`") {
			const result = readQuotedText(content, index, character);
			if (!isModuleSpecifier(content, index)) {
				segments.push({ start: result.start, text: result.text });
			}
			index = result.nextIndex;
			continue;
		}
		if (character === ">") {
			const tagStart = content.lastIndexOf("<", index);
			if (tagStart !== -1 && /^<\/?[A-Za-z][^<>]*>$/.test(content.slice(tagStart, index + 1))) {
				const textStart = index + 1;
				const textEnd = content.indexOf("<", textStart);
				if (textEnd !== -1) {
					segments.push({ start: textStart, text: content.slice(textStart, textEnd) });
				}
			}
		}

		index += 1;
	}

	return segments;
}

function readQuotedText(content: string, quoteStart: number, quote: string) {
	let index = quoteStart + 1;
	let text = "";

	while (index < content.length) {
		const character = content[index];
		if (character === "\\") {
			text += content[index + 1] ?? "";
			index += 2;
			continue;
		}
		if (character === quote) {
			return { start: quoteStart + 1, text, nextIndex: index + 1 };
		}
		text += character;
		index += 1;
	}

	return { start: quoteStart + 1, text, nextIndex: content.length };
}

function skipLineComment(content: string, index: number): number {
	const lineEnd = content.indexOf("\n", index);
	return lineEnd === -1 ? content.length : lineEnd;
}

function skipBlockComment(content: string, index: number): number {
	const commentEnd = content.indexOf("*/", index);
	return commentEnd === -1 ? content.length : commentEnd + 2;
}

function isModuleSpecifier(content: string, quoteStart: number): boolean {
	const prefix = content.slice(Math.max(0, quoteStart - 24), quoteStart);
	return /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)$/.test(prefix);
}

function findTermOffsets(text: string, term: ForbiddenTerm): number[] {
	const boundary = "[^\\p{L}\\p{N}_]";
	const pattern = new RegExp(`(?:^|${boundary})(${escapeRegExp(term)})(?=$|${boundary})`, "giu");
	const offsets: number[] = [];

	for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
		offsets.push(match.index + match[0].length - match[1].length);
	}

	return offsets;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLine(content: string, offset: number): number {
	return content.slice(0, offset).split("\n").length;
}

function getColumn(content: string, offset: number): number {
	const lineStart = content.lastIndexOf("\n", offset - 1);
	return offset - lineStart;
}

function getLineText(content: string, offset: number): string {
	const lineStart = content.lastIndexOf("\n", offset - 1) + 1;
	const lineEnd = content.indexOf("\n", offset);
	return content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd).trim();
}

function isMainModule() {
	return typeof process.argv[1] === "string" && /(?:^|[\\/])forbidden-term-scan\.(?:ts|js)$/.test(process.argv[1]);
}

if (isMainModule()) {
	const matches = scanForbiddenTerms(process.argv[2] ?? process.cwd());
	if (matches.length > 0) {
		console.error(formatForbiddenTermMatches(matches));
		process.exitCode = 1;
	} else {
		console.log("No forbidden developer vocabulary found in learner-facing targets.");
	}
}
