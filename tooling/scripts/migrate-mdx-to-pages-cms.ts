import { readdir, readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type MigratePageInput = {
	type: "POST";
	slug: string;
	locale: string;
	title: string;
	excerpt: string | null;
	body: string;
	tags: string[];
	status: "PUBLISHED" | "DRAFT";
	publishedAt: Date | null;
};

export type MigrateResult = {
	wouldCreate: number;
	created: number;
	failed: Array<{ file: string; error: string }>;
	files: string[];
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseScalar(value: string): string | boolean {
	const trimmed = value.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseInlineList(value: string): string[] {
	const inner = value.trim().replace(/^\[/, "").replace(/\]$/, "");
	if (!inner.trim()) return [];
	return inner
		.split(",")
		.map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
		.filter(Boolean);
}

export function parseMdxFrontmatter(source: string): {
	title: string;
	date?: string;
	tags: string[];
	published: boolean;
	excerpt: string | null;
	body: string;
} {
	const match = source.match(FRONTMATTER_RE);
	if (!match) {
		throw new Error("missing frontmatter");
	}

	const [, rawMatter, body] = match;
	const data: Record<string, unknown> = {};
	const lines = rawMatter.split(/\r?\n/);
	let currentListKey: string | null = null;

	for (const line of lines) {
		const listItem = line.match(/^\s+-\s+(.*)$/);
		if (listItem && currentListKey) {
			const list = Array.isArray(data[currentListKey]) ? (data[currentListKey] as string[]) : [];
			list.push(String(parseScalar(listItem[1] ?? "")));
			data[currentListKey] = list;
			continue;
		}

		const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
		if (!kv) {
			currentListKey = null;
			continue;
		}
		const key = kv[1] ?? "";
		const value = kv[2] ?? "";
		if (value === "" || value === "|" || value === ">") {
			currentListKey = key;
			data[key] = [];
			continue;
		}
		currentListKey = null;
		if (value.startsWith("[")) {
			data[key] = parseInlineList(value);
			continue;
		}
		data[key] = parseScalar(value);
	}

	const title = typeof data.title === "string" ? data.title.trim() : "";
	if (!title) {
		throw new Error("missing title");
	}

	return {
		title,
		date: typeof data.date === "string" ? data.date : undefined,
		tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
		published: data.published === true,
		excerpt: typeof data.excerpt === "string" ? data.excerpt : null,
		body: (body ?? "").trim(),
	};
}

function slugFromFilename(filePath: string): { slug: string; locale: string } {
	const base = filePath.split("/").pop() ?? filePath;
	const withoutExt = base.replace(/\.(mdx|md)$/i, "");
	const localeMatch = withoutExt.match(/^(.*)\.([a-z]{2}(?:-[a-z]{2})?)$/i);
	if (localeMatch) {
		return { slug: localeMatch[1] ?? withoutExt, locale: localeMatch[2]?.toLowerCase() ?? "zh-tw" };
	}
	return { slug: withoutExt, locale: "zh-tw" };
}

async function collectMdxFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectMdxFiles(full)));
			continue;
		}
		if (/\.(mdx|md)$/i.test(entry.name)) {
			files.push(full);
		}
	}
	return files.sort();
}

export async function migrateMdxToPagesCms(options: {
	dir: string;
	dryRun: boolean;
	createPage?: (input: MigratePageInput) => Promise<unknown>;
}): Promise<MigrateResult> {
	const files = await collectMdxFiles(options.dir);
	const failed: Array<{ file: string; error: string }> = [];
	const records: MigratePageInput[] = [];

	for (const file of files) {
		try {
			const source = await readFile(file, "utf8");
			const parsed = parseMdxFrontmatter(source);
			const { slug, locale } = slugFromFilename(file);
			records.push({
				type: "POST",
				slug,
				locale,
				title: parsed.title,
				excerpt: parsed.excerpt,
				body: parsed.body,
				tags: parsed.tags,
				status: parsed.published ? "PUBLISHED" : "DRAFT",
				publishedAt: parsed.date ? new Date(parsed.date) : null,
			});
		} catch (error) {
			failed.push({
				file: relative(options.dir, file) || file,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	if (options.dryRun) {
		return {
			wouldCreate: records.length,
			created: 0,
			failed,
			files: records.map((record) => record.slug),
		};
	}

	const createPage = options.createPage;
	if (!createPage) {
		throw new Error("createPage is required when dryRun is false");
	}

	let created = 0;
	for (const record of records) {
		await createPage(record);
		created += 1;
	}

	return {
		wouldCreate: records.length,
		created,
		failed,
		files: records.map((record) => record.slug),
	};
}

function parseArgs(argv: string[]) {
	const dryRun = argv.includes("--dry-run");
	const dirIndex = argv.indexOf("--dir");
	const dirArg = dirIndex >= 0 ? argv[dirIndex + 1] : "apps/marketing/content/posts";
	const dir = isAbsolute(dirArg ?? "") ? (dirArg as string) : resolve(process.cwd(), dirArg ?? ".");
	return { dryRun, dir };
}

async function defaultCreatePage(input: MigratePageInput) {
	const { db } = await import("@startkiter/database");
	return db.page.create({ data: input });
}

async function main() {
	const { dryRun, dir } = parseArgs(process.argv.slice(2));
	const result = await migrateMdxToPagesCms({
		dir,
		dryRun,
		createPage: dryRun ? undefined : defaultCreatePage,
	});
	console.log(
		JSON.stringify(
			{
				dir,
				dryRun,
				wouldCreate: result.wouldCreate,
				created: result.created,
				failed: result.failed,
				files: result.files,
			},
			null,
			2,
		),
	);
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
