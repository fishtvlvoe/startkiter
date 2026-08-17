import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const SOURCE_ROOT = "/Users/fishtv/Development/products/startkiter/code/supastarter-nextjs-main";

const TABLE_PATH = resolve(
	repoRoot,
	"openspec/changes/extract-supastarter-design-system/version-gap.md",
);

const PACKAGES = ["next", "react", "tailwindcss", "radix-ui"] as const;

const VALID_STATUS = new Set(["相同", "StartKiter 較舊", "StartKiter 較新"]);

function collectDeclaredVersions(files: string[]) {
	const versions: Record<string, string> = {};

	for (const file of files) {
		if (!existsSync(file)) {
			continue;
		}

		const json = JSON.parse(readFileSync(file, "utf8")) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};

		Object.assign(versions, json.devDependencies, json.dependencies);
	}

	return versions;
}

function collectCatalogVersions(workspaceFile: string) {
	const text = readFileSync(workspaceFile, "utf8");
	const catalog = text.split(/\ncatalog:\n/)[1] ?? "";
	const versions: Record<string, string> = {};

	for (const line of catalog.split("\n")) {
		const match = line.match(/^\s+([@\w./-]+):\s+(\S+)\s*$/);

		if (match) {
			versions[match[1]] = match[2];
		}
	}

	return versions;
}

function stripRange(raw: string) {
	return raw.replace(/^[\^~]/, "");
}

function compareTriple(left: string, right: string) {
	const a = stripRange(left).split(".").map(Number);
	const b = stripRange(right).split(".").map(Number);
	const length = Math.max(a.length, b.length);

	for (let i = 0; i < length; i += 1) {
		const delta = (a[i] ?? 0) - (b[i] ?? 0);

		if (delta < 0) {
			return -1;
		}

		if (delta > 0) {
			return 1;
		}
	}

	return 0;
}

function statusOf(local: string | undefined, source: string | undefined) {
	if (!local && source) {
		return "StartKiter 較舊";
	}

	if (local && !source) {
		return "StartKiter 較新";
	}

	if (!local || !source) {
		throw new Error("missing both versions");
	}

	if (stripRange(local) === stripRange(source)) {
		return "相同";
	}

	const cmp = compareTriple(local, source);

	if (cmp < 0) {
		return "StartKiter 較舊";
	}

	if (cmp > 0) {
		return "StartKiter 較新";
	}

	return "相同";
}

describe("design-system version gap", () => {
	it("writes a comparison table for next, react, tailwindcss, and radix-ui", () => {
		expect(existsSync(SOURCE_ROOT)).toBe(true);

		const local = collectDeclaredVersions([
			resolve(repoRoot, "apps/saas/package.json"),
			resolve(repoRoot, "packages/ui/package.json"),
			resolve(repoRoot, "package.json"),
		]);

		const source = collectCatalogVersions(resolve(SOURCE_ROOT, "pnpm-workspace.yaml"));
		const table = readFileSync(TABLE_PATH, "utf8");

		for (const name of PACKAGES) {
			const status = statusOf(local[name], source[name]);

			expect(VALID_STATUS.has(status)).toBe(true);
			expect(table).toContain(`| ${name} |`);
			expect(table).toContain(status);
		}
	});
});
