import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("Chinese text renders with a CJK font fallback", () => {
	it("puts Noto Sans TC immediately after DM Sans in every font-family declaration", () => {
		const css = readFileSync(resolve(repoRoot, "apps/saas/app/globals.css"), "utf8");
		const declarations = [...css.matchAll(/font-family:\s*([^;]+);/g)].map((match) => match[1]);
		const withDmSans = declarations.filter((value) => value.includes("DM Sans"));

		expect(withDmSans.length).toBeGreaterThan(0);

		for (const value of withDmSans) {
			const fonts = value.split(",").map((part) => part.trim().replace(/^["']|["']$/g, ""));
			const dmIndex = fonts.findIndex((name) => name === "DM Sans");

			expect(fonts[dmIndex + 1]).toBe("Noto Sans TC");
		}
	});
});
