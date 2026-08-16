import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const SOURCE_ROOT = "/Users/fishtv/Development/products/startkiter/code/supastarter-nextjs-main";

function extractCustomProperty(css: string, name: string) {
	const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
	return match?.[1].trim();
}

describe("design tokens are ported, not approximated", () => {
	it("copies --radius from the supastarter theme into apps/saas globals.css", () => {
		const sourceTheme = readFileSync(resolve(SOURCE_ROOT, "tooling/tailwind/theme.css"), "utf8");
		const sourceGlobals = readFileSync(resolve(SOURCE_ROOT, "apps/saas/app/globals.css"), "utf8");
		const localGlobals = readFileSync(resolve(repoRoot, "apps/saas/app/globals.css"), "utf8");

		expect(extractCustomProperty(localGlobals, "--radius")).toBe(
			extractCustomProperty(sourceTheme, "--radius"),
		);
		expect(extractCustomProperty(localGlobals, "--radius")).toBe("0.75rem");
		expect(sourceGlobals).toContain("@variant dark (&:where(.dark, .dark *));");
		expect(localGlobals).toContain("@variant dark (&:where(.dark, .dark *));");
	});
});
