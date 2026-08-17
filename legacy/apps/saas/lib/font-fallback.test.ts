import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const saasRoot = resolve(repoRoot, "apps/saas");

function findCssAndLayoutFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);

		if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
			return findCssAndLayoutFiles(path);
		}

		return entry.isFile() && (entry.name.endsWith(".css") || basename(entry.name) === "layout.tsx") ? [path] : [];
	});
}

describe("SaaS uses the Inter font strategy", () => {
	it("does not declare DM Sans or Noto Sans TC in CSS or layout files", () => {
		const fontFiles = findCssAndLayoutFiles(saasRoot);

		expect(fontFiles.length).toBeGreaterThan(0);

		for (const file of fontFiles) {
			const source = readFileSync(file, "utf8");

			expect(source, file).not.toMatch(/DM Sans|Noto Sans TC/);
		}
	});
});
