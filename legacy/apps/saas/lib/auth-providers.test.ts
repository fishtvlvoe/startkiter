import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const loginFormPath = resolve(repoRoot, "apps/saas/app/login/login-form.tsx");
const signupPath = resolve(repoRoot, "apps/saas/app/signup/page.tsx");
const loginPagePath = resolve(repoRoot, "apps/saas/app/login/page.tsx");

describe("auth provider list is structurally extensible", () => {
	it("renders social login buttons from AUTH_SOCIAL_PROVIDERS.map instead of hardcoded blocks", () => {
		const src = readFileSync(loginFormPath, "utf8");

		expect(src).toMatch(/export const AUTH_SOCIAL_PROVIDERS/);
		expect(src).toMatch(/AUTH_SOCIAL_PROVIDERS[\s\S]*\.map\(/);
		expect(src).not.toMatch(/googleEnabled \?\s*\(/);
		expect(src).not.toMatch(/lineEnabled \?\s*\(/);
	});

	it("adding a test provider to the list does not require login or signup layout edits", () => {
		const src = readFileSync(loginFormPath, "utf8");
		const withTestProvider = src.replace(
			/\{ id: "line", label: "使用 LINE 登入" \}/,
			'{ id: "line", label: "使用 LINE 登入" },\n\t{ id: "test", label: "使用測試登入" }',
		);

		expect(withTestProvider).toContain('label: "使用測試登入"');
		expect(withTestProvider).toMatch(/AUTH_SOCIAL_PROVIDERS[\s\S]*\.map\(/);
		expect(readFileSync(loginPagePath, "utf8")).not.toContain("使用測試登入");
		expect(readFileSync(signupPath, "utf8")).not.toContain("使用測試登入");
	});
});
