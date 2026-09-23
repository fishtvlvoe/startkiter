import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import * as appRegistration from "./app-registration";

const incompleteAppFixture = {
	appId: "design",
	route: { basePath: "/design" },
	menu: {
		labelKey: "design.navLabel",
		icon: { light: "image", dark: "image" },
	},
	eligibility: { userRole: "app-user", grantedBy: "self-serve" },
	i18nNamespace: "design",
	supportedLocales: ["zh-tw", "zh-cn", "en"],
	tests: {
		unit: ["packages/platform/src/app-registration.test.ts"],
		browser: ["tests/design.browser.ts"],
	},
};

type ValidationResult = {
	valid: boolean;
	failures: Array<{ index: number; missing: string[]; conflicts: string[] }>;
};

type ValidateAppRegistry = (entries: readonly unknown[]) => ValidationResult;

describe("App registry CI validation", () => {
	it("validates the checked-in registry and rejects an incomplete fixture", () => {
		const moduleExports = appRegistration as unknown as Record<string, unknown>;
		const candidate = moduleExports.validateAppRegistry;
		expect(typeof candidate).toBe("function");
		if (typeof candidate !== "function") {
			return;
		}

		const validateAppRegistry = candidate as ValidateAppRegistry;
		expect(validateAppRegistry(appRegistration.APP_REGISTRY)).toEqual({ valid: true, failures: [] });

		const result = validateAppRegistry([incompleteAppFixture]);
		expect(result.valid).toBe(false);
		expect(result.failures[0]?.missing).toContain("displayName");
	});

	it("has a CI workflow that runs the registry validation command for registry changes", () => {
		const workflowPath = fileURLToPath(new URL("../../../.github/workflows/app-registry.yml", import.meta.url));
		expect(existsSync(workflowPath)).toBe(true);
		if (!existsSync(workflowPath)) {
			return;
		}

		const workflow = readFileSync(workflowPath, "utf8");
		expect(workflow).toContain("validate:app-registry");
		expect(workflow).toContain("packages/platform/src/app-registration.ts");
	});
});
