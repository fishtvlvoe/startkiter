import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("SaaS CSS architecture", () => {
	it("imports the shared theme and keeps globals.css concise", () => {
		const globals = readFileSync(resolve(repoRoot, "apps/saas/app/globals.css"), "utf8");
		const lineCount = globals.trimEnd().split(/\r?\n/).length;

		expect(globals).toContain('@import "../../../packages/tooling/tailwind/theme.css";');
		expect(lineCount).toBeLessThanOrEqual(100);
	});
});
