import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { migrateMdxToPagesCms } from "./migrate-mdx-to-pages-cms";

const fixtures: string[] = [];

function makeFixtureDir() {
	const dir = mkdtempSync(join(tmpdir(), "pages-cms-mdx-"));
	fixtures.push(dir);
	return dir;
}

afterEach(() => {
	while (fixtures.length > 0) {
		const dir = fixtures.pop();
		if (dir) rmSync(dir, { recursive: true, force: true });
	}
});

describe("migrate-mdx-to-pages-cms (Requirement: Existing file-based content can be migrated into the database)", () => {
	it("dry-run reports the intended count and does not write to the database", async () => {
		const dir = makeFixtureDir();
		writeFileSync(
			join(dir, "hello.mdx"),
			`---
title: Hello
date: 2026-08-01
tags:
  - news
published: true
---
# Hello
`,
		);
		const create = vi.fn();

		const result = await migrateMdxToPagesCms({
			dir,
			dryRun: true,
			createPage: create,
		});

		expect(result.wouldCreate).toBe(1);
		expect(result.created).toBe(0);
		expect(result.failed).toEqual([]);
		expect(create).not.toHaveBeenCalled();
	});

	it("maps title, date, tags, and published into Page fields on a real run", async () => {
		const dir = makeFixtureDir();
		mkdirSync(join(dir, "nested"), { recursive: true });
		writeFileSync(
			join(dir, "hello.mdx"),
			`---
title: Hello World
date: 2026-08-01
tags:
  - news
  - launch
published: true
---
Body here
`,
		);
		writeFileSync(join(dir, "broken.mdx"), "no frontmatter");
		const create = vi.fn().mockResolvedValue({ id: "page_1" });

		const result = await migrateMdxToPagesCms({
			dir,
			dryRun: false,
			createPage: create,
		});

		expect(result.created).toBe(1);
		expect(result.failed).toEqual(
			expect.arrayContaining([expect.objectContaining({ file: expect.stringContaining("broken.mdx") })]),
		);
		expect(create).toHaveBeenCalledTimes(1);
		expect(create.mock.calls[0]?.[0]).toMatchObject({
			title: "Hello World",
			publishedAt: new Date("2026-08-01"),
			tags: ["news", "launch"],
			status: "PUBLISHED",
		});
	});

	it("sanitizes script, onerror, and javascript: payloads before writing", async () => {
		const dir = makeFixtureDir();
		writeFileSync(
			join(dir, "xss.mdx"),
			`---
title: Unsafe
date: 2026-08-01
tags:
  - xss
published: true
---
<p>ok</p><script>alert(1)</script><img src="https://example.com/x.png" onerror=alert(1)><a href="javascript:alert(1)">click</a>
`,
		);
		const create = vi.fn().mockResolvedValue({ id: "page_xss" });

		const result = await migrateMdxToPagesCms({
			dir,
			dryRun: false,
			createPage: create,
		});

		expect(result.created).toBe(1);
		expect(result.warnings.length).toBeGreaterThan(0);
		const written = create.mock.calls[0]?.[0] as { body: string };
		expect(written.body).not.toMatch(/<script/i);
		expect(written.body).not.toMatch(/onerror/i);
		expect(written.body).not.toMatch(/javascript:/i);
		expect(written.body).toContain("ok");
	});
});
