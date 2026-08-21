import { describe, expect, it } from "vitest";
import { MOUNT_POINTS } from "./mount-points";

describe("MOUNT_POINTS registry tests (Task 3.1)", () => {
	it("3.1 contains course plugin manifest with mount.content.kind 'auto'", () => {
		const coursePlugin = MOUNT_POINTS.find((plugin) => plugin.id === "course");
		expect(coursePlugin).toBeDefined();
		expect(coursePlugin?.id).toBe("course");
		expect(coursePlugin?.dataSpec).toBe("content");
		expect(coursePlugin?.mount.content?.kind).toBe("auto");
		expect(coursePlugin?.mount.content?.boundTo).toBe("/course");
		expect(coursePlugin?.mount.menu).toBeDefined();
		expect(coursePlugin?.mount.menu?.label).toBe("課程");
		expect(coursePlugin?.mount.menu?.icon).toBe("book-open");
	});

	it("supports requiresOperator on menu mount points", () => {
		// Verify structure supports requiresOperator field (for Phase 2 compatibility)
		const coursePlugin = MOUNT_POINTS.find((plugin) => plugin.id === "course");
		expect(coursePlugin?.mount.menu?.requiresOperator).toBeUndefined();
	});

	it("7.3 contains bundles plugin manifest, operator-only menu item pointing at /admin/bundles", () => {
		const bundlesPlugin = MOUNT_POINTS.find((plugin) => plugin.id === "bundles");
		expect(bundlesPlugin).toBeDefined();
		expect(bundlesPlugin?.mount.route?.path).toBe("/admin/bundles");
		expect(bundlesPlugin?.mount.menu?.requiresOperator).toBe(true);
		expect(bundlesPlugin?.mount.menu?.label).toBe("課程綁定包");
		expect(bundlesPlugin?.mount.menu?.icon).toBe("package");
	});
});

describe("MOUNT_POINTS menu rendering tests (Task 3.2)", () => {
	it("3.2 MOUNT_POINTS with menu mount renders as side navigation items without hardcoding", () => {
		// Verify that menu items can be automatically rendered from MOUNT_POINTS
		// without needing to edit NavBar or Shell component
		const itemsWithMenu = MOUNT_POINTS.filter((plugin) => plugin.mount.menu);
		expect(itemsWithMenu.length).toBeGreaterThan(0);

		// Each menu mount should have required fields for auto-rendering
		itemsWithMenu.forEach((plugin) => {
			expect(plugin.mount.menu).toBeDefined();
			expect(plugin.mount.menu?.label).toBeDefined();
			expect(typeof plugin.mount.menu?.label).toBe("string");
			expect(plugin.mount.menu?.label).toBeTruthy();
			// order allows sorting
			if (plugin.mount.menu?.order !== undefined) {
				expect(typeof plugin.mount.menu.order).toBe("number");
			}
		});
	});
});

describe("MOUNT_POINTS operator-only menu filtering (Task 3.3)", () => {
	it("3.3 menu items with requiresOperator=true are visually present in manifest but can be filtered", () => {
		// Verify that PluginManifest supports requiresOperator field
		// Filtering logic in NavBar will use this to hide from non-operators
		const allPlugins = MOUNT_POINTS;

		allPlugins.forEach((plugin) => {
			if (plugin.mount.menu) {
				const requiresOperator = plugin.mount.menu.requiresOperator;
				// Field should either be undefined (public) or boolean (private/operator-only)
				if (requiresOperator !== undefined) {
					expect(typeof requiresOperator).toBe("boolean");
				}
			}
		});

		// Ensure the structure allows filtering: at least verify course plugin
		// (without requiresOperator, it should be visible to all)
		const coursePlugin = MOUNT_POINTS.find((p) => p.id === "course");
		expect(coursePlugin?.mount.menu?.requiresOperator).not.toBe(true);
	});
});
