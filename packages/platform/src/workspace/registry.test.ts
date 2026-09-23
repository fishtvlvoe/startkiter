import { describe, expect, it } from "vitest";

import { MOUNT_POINTS } from "../mount-points";
import { resolveNavigation } from "./navigation";
import { toAppManifestEntries } from "./registry";
import type { PluginManifest } from "../types";

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
			"quiz",
			"assignment",
			"review",
			"bundles",
			"onboarding-surveys",
			"media-library",
			"course-pack-admin",
		]);
	});
});
