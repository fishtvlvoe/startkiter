import { describe, expect, it } from "vitest";

import { MOUNT_POINTS } from "../mount-points";
import { updateAppDisplayName, type AppRegistrationManifest } from "../app-registration";
import { resolveNavigation } from "./navigation";
import { toAppManifestEntries } from "./registry";
import type { PluginManifest } from "../types";

const designRegistration: AppRegistrationManifest = {
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
		unit: ["packages/platform/src/workspace/registry.test.ts"],
		browser: ["tests/design.browser.ts"],
	},
};

const designMountPoint: PluginManifest = {
	id: "design",
	name: "設計模組",
	version: "0.1.0",
	app: {
		appId: "design",
		scope: "app",
		displayName: "設計",
		displayNameKey: "design.navLabel",
		requiredRole: "app-user",
	},
	mount: {
		route: { path: "/design" },
		menu: { labelKey: "design.navLabel", icon: "image", order: 1 },
	},
	dataSpec: "none",
};

const designAdminMountPoint: PluginManifest = {
	...designMountPoint,
	app: { ...designMountPoint.app!, requiredRole: "app-admin" },
	mount: {
		...designMountPoint.mount,
		route: { path: "/admin/design" },
	},
};

describe("App registry adapter", () => {
	it("converts one plugin manifest without creating a second menu literal", () => {
		const source: PluginManifest = {
			id: "course",
			name: "課程模組",
			version: "0.1.0",
			app: {
				appId: "course",
				scope: "app",
				displayName: "課程",
				displayNameKey: "course.navLabel",
				requiredRole: "app-user",
			},
			mount: {
				route: { path: "/course" },
				menu: { labelKey: "course.navLabel", icon: "book-open", order: 1 },
			},
			dataSpec: "content",
		};

		expect(toAppManifestEntries([source])).toEqual([
			expect.objectContaining({
				id: "course",
				appId: "course",
				scope: "app",
				displayNameKey: "course.navLabel",
				requiredRole: "app-user",
				menu: expect.objectContaining({ labelKey: "course.navLabel" }),
			}),
		]);
	});

	it("converts every current mount point with a menu into an App manifest", () => {
		const entries = toAppManifestEntries(MOUNT_POINTS);

		expect(entries).toHaveLength(MOUNT_POINTS.filter((plugin) => plugin.mount.menu && plugin.mount.route).length);
		expect(entries.every((entry) => entry.menu?.labelKey)).toBe(true);
		expect(entries.find((entry) => entry.id === "course-admin")?.appId).toBe("course");
	});

	it("lets the current course routes resolve through the same registry", () => {
		const model = resolveNavigation({
			pathname: "/admin/course",
			capabilities: { userId: "user-1", platformAdmin: false, appRoles: { course: "app-admin" } },
			apps: toAppManifestEntries(MOUNT_POINTS),
		});

		expect(model.workspace).toEqual({ scope: "app", appId: "course", role: "app-admin" });
		expect(model.items.map((item) => item.id)).toEqual(["course-admin"]);
		expect(model.items[0]?.children.map((item) => item.id)).toEqual([
			"course-dashboard",
			"quiz",
			"assignment",
			"review",
			"course-comments",
			"course-messages",
			"course-coupons",
			"bundles",
			"onboarding-surveys",
			"media-library",
			"course-pack-admin",
		]);
	});

	it("uses the updated App displayName on the next navigation resolve", () => {
		const registry = [structuredClone(designRegistration)];
		const capabilities = {
			userId: "user-1",
			platformAdmin: false,
			appRoles: { design: "app-admin" as const },
		};

		const beforeUpdate = resolveNavigation({
			pathname: "/admin/design",
			capabilities,
			apps: toAppManifestEntries([designAdminMountPoint], registry),
		});
		expect(beforeUpdate.workspaceLabel).toBe("設計管理員");

		const update = updateAppDisplayName(registry, {
			appId: "design",
			displayName: "圖片設計",
			actor: { appId: "design", role: "app-admin" },
		});
		expect(update.updated).toBe(true);

		const afterUpdate = resolveNavigation({
			pathname: "/admin/design",
			capabilities,
			apps: toAppManifestEntries([designAdminMountPoint], registry),
		});
		expect(afterUpdate.workspaceLabel).toBe("圖片設計管理員");
	});
});
