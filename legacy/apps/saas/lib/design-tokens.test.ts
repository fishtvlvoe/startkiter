import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const SOURCE_ROOT = resolve(repoRoot, "vendor/supastarter-nextjs");
const LOCAL_THEME = resolve(repoRoot, "packages/tooling/tailwind/theme.css");

function extractCustomProperty(css: string, name: string) {
	const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
	return match?.[1].trim();
}

describe("design tokens are ported, not approximated", () => {
	it("keeps the official theme in a standalone shared package", () => {
		expect(existsSync(LOCAL_THEME)).toBe(true);

		const sourceTheme = readFileSync(resolve(SOURCE_ROOT, "tooling/tailwind/theme.css"), "utf8");
		const localTheme = readFileSync(LOCAL_THEME, "utf8");

		expect(localTheme).toContain("--background:");
		expect(localTheme).toContain("--primary:");
		expect(localTheme).toContain("--border:");
		expect(localTheme).toBe(sourceTheme);
	});

	it("copies --radius from the supastarter theme into the local theme", () => {
		const sourceTheme = readFileSync(resolve(SOURCE_ROOT, "tooling/tailwind/theme.css"), "utf8");
		const sourceGlobals = readFileSync(resolve(SOURCE_ROOT, "apps/saas/app/globals.css"), "utf8");
		const localGlobals = readFileSync(resolve(repoRoot, "apps/saas/app/globals.css"), "utf8");
		const localTheme = readFileSync(LOCAL_THEME, "utf8");

		expect(extractCustomProperty(localTheme, "--radius")).toBe(
			extractCustomProperty(sourceTheme, "--radius"),
		);
		expect(extractCustomProperty(localTheme, "--radius")).toBe("0.625rem");
		expect(sourceGlobals).toContain("@variant dark (&:where(.dark, .dark *));");
		expect(localGlobals).toContain("@variant dark (&:where(.dark, .dark *));");
	});
});
