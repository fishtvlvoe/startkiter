import { describe, expect, it } from "vitest";

import {
	COURSE_APP_REGISTRATION_MANIFEST,
	registerApp,
	updateAppDisplayName,
	type AppRegistrationManifest,
} from "./app-registration";

const validManifest: AppRegistrationManifest = {
	appId: "design",
	displayName: "設計",
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

function copyManifest(): AppRegistrationManifest {
	return structuredClone(validManifest);
}

describe("App registration manifest", () => {
	it.each([
		["displayName", (manifest: Record<string, unknown>) => delete manifest.displayName],
		["route.basePath", (manifest: Record<string, unknown>) => delete (manifest.route as Record<string, unknown>).basePath],
		["menu.icon.light", (manifest: Record<string, unknown>) => delete (manifest.menu as Record<string, unknown>).icon],
		["menu.icon.dark", (manifest: Record<string, unknown>) => {
			const menu = manifest.menu as Record<string, unknown>;
			(menu.icon as Record<string, unknown>).dark = "";
		}],
		["supportedLocales.en", (manifest: Record<string, unknown>) => {
			manifest.supportedLocales = ["zh-tw", "zh-cn"];
		}],
	] as const)("rejects a manifest missing %s and does not register it", (missingField, removeField) => {
		const registry: AppRegistrationManifest[] = [];
		const manifest = copyManifest() as unknown as Record<string, unknown>;
		removeField(manifest);

		const result = registerApp(manifest, registry);

		expect(result.registered).toBe(false);
		expect(result.missing).toContain(missingField);
		expect(registry).toEqual([]);
	});

	it("rejects duplicate appId and route.basePath and names the conflicting app", () => {
		const existing = copyManifest();
		const registry = [existing];

		const duplicateAppId = registerApp({ ...copyManifest(), route: { basePath: "/another" } }, registry);
		const duplicateRoute = registerApp({ ...copyManifest(), appId: "another" }, registry);

		expect(duplicateAppId.registered).toBe(false);
		expect(duplicateAppId.conflicts).toContain("appId:design");
		expect(duplicateRoute.registered).toBe(false);
		expect(duplicateRoute.conflicts).toContain("route.basePath:design");
		expect(registry).toHaveLength(1);
	});

	it("accepts a valid registration and the existing course app manifest", () => {
		const registry: AppRegistrationManifest[] = [];

		expect(registerApp(validManifest, registry)).toMatchObject({ registered: true, missing: [], conflicts: [] });
		expect(registerApp(COURSE_APP_REGISTRATION_MANIFEST, [])).toMatchObject({
			registered: true,
			missing: [],
			conflicts: [],
		});
	});
});

describe("App displayName updates", () => {
	it("allows only the app's own app-admin to update displayName", () => {
		const registry = [copyManifest()];

		const result = updateAppDisplayName(registry, {
			appId: "design",
			displayName: "圖片設計",
			actor: { appId: "design", role: "app-admin" },
		});

		expect(result.updated).toBe(true);
		expect(registry[0]?.displayName).toBe("圖片設計");
	});

	it.each([
		["app-user", { appId: "design", role: "app-user" as const }],
		["another app-admin", { appId: "course", role: "app-admin" as const }],
	] as const)("rejects %s", (_reason, actor) => {
		const registry = [copyManifest()];

		const result = updateAppDisplayName(registry, {
			appId: "design",
			displayName: "圖片設計",
			actor,
		});

		expect(result.updated).toBe(false);
		expect(registry[0]?.displayName).toBe("設計");
	});

	it.each(["總管理員", "使用者", "", "   "])("rejects reserved or blank displayName %j", (displayName) => {
		const registry = [copyManifest()];

		const result = updateAppDisplayName(registry, {
			appId: "design",
			displayName,
			actor: { appId: "design", role: "app-admin" },
		});

		expect(result.updated).toBe(false);
		expect(registry[0]?.displayName).toBe("設計");
	});
});
