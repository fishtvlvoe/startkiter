import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("course pages use the shared course chrome", () => {
	it("keeps lesson list, player, comments placeholder, and course-admin entry", () => {
		const indexSrc = readFileSync(resolve(repoRoot, "apps/saas/app/course/page.tsx"), "utf8");
		const lessonSrc = readFileSync(resolve(repoRoot, "apps/saas/app/course/[lessonId]/page.tsx"), "utf8");
		const workspaceSrc = readFileSync(resolve(repoRoot, "apps/saas/app/course/course-workspace.tsx"), "utf8");
		const shellSrc = readFileSync(resolve(repoRoot, "apps/saas/app/components/app-shell.tsx"), "utf8");

		expect(indexSrc).toContain("AppShell");
		expect(lessonSrc).toContain("AppShell");
		expect(workspaceSrc).toContain('data-slot="lesson-list"');
		expect(workspaceSrc).toContain('data-slot="comments"');
		expect(indexSrc).toContain('data-slot="player"');
		expect(lessonSrc).toContain('data-slot="player"');
		expect(shellSrc).toContain('data-slot="course-admin"');
		expect(shellSrc).toContain("sidebar-collapse-toggle");
	});
});
