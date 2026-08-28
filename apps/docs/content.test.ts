import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { multilingualSearchTokenizer } from "./lib/search-tokenizer";

const appRoot = resolve(import.meta.dirname);
const docsRoot = resolve(appRoot, "content/docs");
const read = (relativePath: string) => readFileSync(resolve(appRoot, relativePath), "utf8");

describe("buyer docs content contract", () => {
	it("documents every environment variable from the source example", () => {
		const sourceNames = read("../saas/.env.example")
				.match(/^[A-Z0-9_]+=/gm)
			?.map((name) => name.slice(0, -1));
		const documentedNames = read("content/docs/getting-started/environment-variables.mdx")
				.match(/^\| `([A-Z0-9_]+)` \|/gm)
			?.map((row) => row.match(/`([A-Z0-9_]+)`/)?.[1]);

		expect(sourceNames).toHaveLength(88);
		expect(documentedNames).toEqual(sourceNames);
	});

	it("keeps the core boundary contract visible", () => {
		const content = read("content/docs/core-and-plugins/core-boundary.mdx");

		expect(content).toContain("route");
		expect(content).toContain("menu");
		expect(content).toContain("content");
		expect(content).toContain('dataSpec: "content" | "none"');
		expect(content).toContain("packages/platform/");
		expect(content).toContain("packages/payments/");
	});

	it("does not publish unvalidated deployment commands", () => {
		const content = read("content/docs/deployment/overview.mdx");

		expect(content).toContain("詳細部署步驟撰寫中，正式上線後回填");
		expect(content).not.toMatch(/```|git fetch|git merge|docker|pnpm|npm|coolify/i);
	});

	it("keeps the five buyer-facing pages in navigation", () => {
		const files = [
			"content/docs/getting-started/environment-variables.mdx",
			"content/docs/getting-started/local-development.mdx",
			"content/docs/core-and-plugins/core-boundary.mdx",
			"content/docs/core-and-plugins/upstream-sync.mdx",
			"content/docs/deployment/overview.mdx",
		];

		for (const file of files) {
			expect(readFileSync(resolve(appRoot, file), "utf8")).toMatch(/^title:/m);
		}
		expect(JSON.parse(readFileSync(resolve(docsRoot, "meta.json"), "utf8"))).toEqual({
			pages: ["index", "getting-started", "core-and-plugins", "deployment"],
		});
	});

	it("tokenizes Traditional Chinese and ASCII terms for full-text search", () => {
		expect(
			multilingualSearchTokenizer.tokenize("環境變數 PAYUNi dataSpec"),
		).toEqual(["環", "境", "變", "數", "payuni", "dataspec"]);
	});
});
