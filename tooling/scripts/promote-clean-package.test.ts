import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
	classifyPaths,
	parseArgs,
	promoteCleanPackage,
	scanForbiddenContent,
} from "./promote-clean-package";

const fixtures: string[] = [];

const makeFixture = () => {
	const root = mkdtempSync(join(tmpdir(), "startkiter-promote-"));
	fixtures.push(root);

	const write = (relative: string, content: string) => {
		const full = join(root, relative);
		mkdirSync(join(full, ".."), { recursive: true });
		writeFileSync(full, content);
	};

	write("package.json", '{"name":"startkiter"}\n');
	write("pnpm-workspace.yaml", "packages:\n  - apps/*\n");
	write("README.md", "StartKiter\n");
	write("apps/saas/package.json", '{"name":"@startkiter/saas"}\n');
	write("apps/saas/app/page.tsx", "export default function Page() { return null; }\n");
	write(
		"apps/saas/app/api/demo/grant-course/route.ts",
		"export function POST() { return Response.json({ demo: true }); }\n",
	);
	write("apps/saas/app/course/demo-grant-button.tsx", "export function DemoGrantButton() { return null; }\n");
	write("packages/auth/index.ts", "export {};\n");
	write("packages/database/prisma/seed/test-users.ts", "export const testUsers = [];\n");
	write("docs/discuss/internal.md", "工寮討論\n");
	write("docs/core-boundary-and-extension-guide.md", "Core boundary\n");
	write("legacy/old.ts", "old\n");
	write("apps/saas/.env.development.local", "PAYUNI_HASH_KEY=super-secret\n");
	write("apps/saas/.env.test", "STRIPE_SECRET_KEY=sk_test_123\n");

	return { root, write };
};

afterEach(() => {
	while (fixtures.length > 0) {
		const dir = fixtures.pop();
		if (dir) rmSync(dir, { recursive: true, force: true });
	}
});

describe("parseArgs", () => {
	it("parses dry-run, target, and release", () => {
		expect(parseArgs(["--dry-run", "--target", "/tmp/kit", "--release", "v1.0.0"])).toEqual({
			dryRun: true,
			target: "/tmp/kit",
			release: "v1.0.0",
			skipVerify: false,
		});
	});
});

describe("classifyPaths", () => {
	it("includes allow-listed app and package files", () => {
		const { root } = makeFixture();
		const result = classifyPaths(root);

		expect(result.included).toEqual(
			expect.arrayContaining([
				"package.json",
				"apps/saas/package.json",
				"apps/saas/app/page.tsx",
				"packages/auth/index.ts",
				"docs/core-boundary-and-extension-guide.md",
			]),
		);
	});

	it("excludes demo routes, test seeds, discuss docs, and legacy", () => {
		const { root } = makeFixture();
		const result = classifyPaths(root);

		expect(result.excluded).toEqual(
			expect.arrayContaining([
				"apps/saas/app/api/demo/grant-course/route.ts",
				"apps/saas/app/course/demo-grant-button.tsx",
				"packages/database/prisma/seed/test-users.ts",
				"docs/discuss/internal.md",
				"legacy/old.ts",
				"apps/saas/.env.development.local",
				"apps/saas/.env.test",
			]),
		);
		expect(result.included).not.toContain("apps/saas/app/api/demo/grant-course/route.ts");
		expect(result.included).not.toContain("docs/discuss/internal.md");
		expect(result.included).not.toContain("apps/saas/.env.development.local");
		expect(result.included).not.toContain("apps/saas/.env.test");
	});
});

describe("scanForbiddenContent", () => {
	it("detects internal domain leaks in included files", () => {
		const { root, write } = makeFixture();
		write("apps/saas/app/page.tsx", 'const host = "https://startkiter.aiver.me";\n');
		const hits = scanForbiddenContent(root, ["apps/saas/app/page.tsx"]);
		expect(hits.some((hit) => hit.includes("startkiter.aiver.me"))).toBe(true);
	});

	it("does not treat mock keys in test files as leaks", () => {
		const { root, write } = makeFixture();
		write("packages/auth/config.test.ts", "-----BEGIN PRIVATE KEY-----\\nX\\n-----END PRIVATE KEY-----\\n");
		expect(scanForbiddenContent(root, ["packages/auth/config.test.ts"])).toEqual([]);
	});
});

describe("promoteCleanPackage", () => {
	it("dry-run reports files without writing the target", async () => {
		const { root } = makeFixture();
		const target = mkdtempSync(join(tmpdir(), "startkiter-kit-"));
		fixtures.push(target);

		const report = await promoteCleanPackage({
			sourceRoot: root,
			target,
			dryRun: true,
			skipVerify: true,
		});

		expect(report.included.length).toBeGreaterThan(0);
		expect(existsSync(join(target, "package.json"))).toBe(false);
		expect(existsSync(join(target, "apps/saas/app/api/demo/grant-course/route.ts"))).toBe(false);
	});

	it("aborts with non-zero semantics when a forbidden token is present", async () => {
		const { root, write } = makeFixture();
		write("README.md", "see https://startkiter.aiver.me\n");
		const target = join(root, "out");

		await expect(
			promoteCleanPackage({
				sourceRoot: root,
				target,
				dryRun: false,
				skipVerify: true,
			}),
		).rejects.toThrow(/startkiter\.aiver\.me/);
		expect(existsSync(join(target, "package.json"))).toBe(false);
	});

	it("copies allow-listed files and skips forbidden paths", async () => {
		const { root } = makeFixture();
		const target = mkdtempSync(join(tmpdir(), "startkiter-kit-"));
		fixtures.push(target);

		const report = await promoteCleanPackage({
			sourceRoot: root,
			target,
			dryRun: false,
			skipVerify: true,
		});

		expect(readFileSync(join(target, "package.json"), "utf8")).toContain("startkiter");
		expect(existsSync(join(target, "apps/saas/app/page.tsx"))).toBe(true);
		expect(existsSync(join(target, "apps/saas/app/api/demo/grant-course/route.ts"))).toBe(false);
		expect(existsSync(join(target, "docs/discuss/internal.md"))).toBe(false);
		expect(report.excluded).toEqual(
			expect.arrayContaining(["apps/saas/app/api/demo/grant-course/route.ts"]),
		);
	});

	it("halts promotion when target verification fails", async () => {
		const { root } = makeFixture();
		const target = mkdtempSync(join(tmpdir(), "startkiter-kit-"));
		fixtures.push(target);

		await expect(
			promoteCleanPackage({
				sourceRoot: root,
				target,
				dryRun: false,
				skipVerify: false,
				runVerify: async () => {
					throw new Error("build failed");
				},
			}),
		).rejects.toThrow(/build failed/);
	});
});
