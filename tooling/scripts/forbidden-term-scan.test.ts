import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { FORBIDDEN_TERMS, scanForbiddenTerms } from "./forbidden-term-scan";

const fixtures: string[] = [];
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function makeFixture() {
	const root = mkdtempSync(join(tmpdir(), "startkiter-forbidden-term-"));
	fixtures.push(root);
	return root;
}

function writeFixture(root: string, relativePath: string, content: string) {
	const path = join(root, relativePath);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
}

afterEach(() => {
	while (fixtures.length > 0) {
		const root = fixtures.pop();
		if (root) rmSync(root, { recursive: true, force: true });
	}
});

describe("forbidden developer vocabulary scan", () => {
	it("reports every forbidden term in learner-facing module and tutorial text", () => {
		const root = makeFixture();

		writeFixture(
			root,
			"apps/saas/modules/demo/VisibleCopy.tsx",
			FORBIDDEN_TERMS.map((term) => `export const copy = "${term}";`).join("\n"),
		);
		writeFixture(
			root,
			"docs/tutorials/app-extension.md",
			FORBIDDEN_TERMS.map((term) => `請不要把 ${term} 顯示給學員。`).join("\n"),
		);

		const matches = scanForbiddenTerms(root);

		expect(matches).toHaveLength(FORBIDDEN_TERMS.length * 2);
		expect(matches.map((match) => match.term)).toEqual(
			expect.arrayContaining([...FORBIDDEN_TERMS, ...FORBIDDEN_TERMS]),
		);
		expect(matches.every((match) => match.line > 0 && match.column > 0)).toBe(true);
	});

	it("ignores program comments and repo-local Skills", () => {
		const root = makeFixture();

		writeFixture(
			root,
			"apps/saas/modules/demo/comments.tsx",
			[
				`// ${FORBIDDEN_TERMS[0]}`,
				`/* ${FORBIDDEN_TERMS.slice(1).join(" ")} */`,
				"export const copy = \"安全文字\";",
			].join("\n"),
		);
		writeFixture(
			root,
			".agents/skills/example/SKILL.md",
			FORBIDDEN_TERMS.join(" "),
		);

		expect(scanForbiddenTerms(root)).toEqual([]);
	});

	it("passes the current repository scan", () => {
		expect(scanForbiddenTerms(repoRoot)).toEqual([]);
	});
});

describe("App authoring guidance", () => {
	it("keeps the registration flow in one Skill without copying the field list", () => {
		const skill = readText(".agents/skills/startkiter-dev/SKILL.md");
		const section = skill.slice(skill.indexOf("## 新增 App"), skill.indexOf("## 情境範例"));

		expect(section).toContain("packages/");
		expect(section).toContain("AppRegistrationManifest");
		expect(section).toContain("light");
		expect(section).toContain("dark");
		expect(section).toContain("zh-tw");
		expect(section).toContain("zh-cn");
		expect(section).toContain("en");
		expect(section).toContain("tests.unit");
		expect(section).toContain("tests.browser");
		expect(section).toContain(
			"../../../openspec/changes/app-extension-contract/specs/app-extension-contract/spec.md",
		);
			expect(
			existsSync(
				resolve(
					dirname(join(repoRoot, ".agents/skills/startkiter-dev/SKILL.md")),
					"../../../openspec/changes/app-extension-contract/specs/app-extension-contract/spec.md",
				),
			),
		).toBe(true);
		expect(section).not.toMatch(/appId|displayName|route\.basePath|eligibility|i18nNamespace/);
	});

	it("points AGENTS.md at the canonical App registration spec", () => {
		const agents = readText("AGENTS.md");

		expect(agents).toContain(
			"](openspec/changes/app-extension-contract/specs/app-extension-contract/spec.md)",
		);
		expect(
			existsSync(
				join(repoRoot, "openspec/changes/app-extension-contract/specs/app-extension-contract/spec.md"),
			),
		).toBe(true);
		expect(agents).toMatch(/新增 App[\s\S]{0,240}註冊契約/);
	});
});

function readText(relativePath: string) {
	return readFileSync(join(repoRoot, relativePath), "utf8");
}
