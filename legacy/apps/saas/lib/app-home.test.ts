import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("app home uses the shared app shell", () => {
	it("renders sidebar collapse and stats cards from the design-system shell", () => {
		const src = readFileSync(resolve(repoRoot, "apps/saas/app/app/page.tsx"), "utf8");

		expect(src).toContain("AppShell");
		expect(src).toContain("stats-grid");
		expect(src).toContain("ds-card");

		const shellSrc = readFileSync(resolve(repoRoot, "apps/saas/app/components/app-shell.tsx"), "utf8");
		expect(shellSrc).toContain("data-test=\"sidebar-collapse-toggle\"");
		expect(shellSrc).toContain("ColorModeToggle");
		expect(shellSrc).toContain("LocaleSwitcher");
		expect(src).toContain("shouldShowOperatorSettingsLink");
		expect(shellSrc).toContain("showOperatorSettings");
		expect(shellSrc).toMatch(/showOperatorSettings\s*\?/);
	});
});
