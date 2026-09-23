import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { MOUNT_POINTS } from "../mount-points";
import { resolveNavigation } from "./navigation";
import { toAppManifestEntries } from "./registry";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const adminRouteRoot = resolve(
	repositoryRoot,
	"apps/saas/app/(authenticated)/(main)/(account)/admin",
);

function routePaths(directory: string, routePrefix: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const absolutePath = resolve(directory, entry.name);
		if (entry.isDirectory()) {
			return routePaths(absolutePath, `${routePrefix}/${entry.name}`);
		}
		return entry.name === "page.tsx" ? [routePrefix] : [];
	});
}

function isWithinRouteTree(route: string, tree: string): boolean {
	return route === tree || route.startsWith(`${tree}/`);
}

describe("App feature route surfaces", () => {
	it("labels the course user surface as App-admin for a platform admin without changing its menu", () => {
		const model = resolveNavigation({
			pathname: "/course",
			capabilities: {
				userId: "platform-admin",
				platformAdmin: true,
				appRoles: { course: "app-admin" },
			},
			apps: toAppManifestEntries(MOUNT_POINTS),
		});

		expect(model.workspace).toEqual({ scope: "app", appId: "course", role: "app-admin" });
		expect(model.workspaceLabel).toBe("課程管理員");
		expect(model.items.map((item) => item.id)).toEqual([
			"start",
			"course",
			"chatbot",
			"ai-assistant",
			"settings",
		]);
	});

	it("keeps every registered course admin route inside /admin/course", () => {
		const courseAdminRoutes = MOUNT_POINTS.filter(
			(plugin) => plugin.app?.appId === "course" && plugin.app.requiredRole === "app-admin",
		).map((plugin) => plugin.mount.route?.path)
			.filter((path): path is string => Boolean(path));

		const misplacedRoutes = courseAdminRoutes.filter((route) => !isWithinRouteTree(route, "/admin/course"));

		expect(misplacedRoutes).toEqual([]);
	});

	it("exposes one course workspace switch without course admin detail on the platform surface", () => {
		const model = resolveNavigation({
			pathname: "/admin/users",
			capabilities: { userId: "platform-admin", platformAdmin: true, appRoles: {} },
			apps: toAppManifestEntries(MOUNT_POINTS),
		});
		const courseEntries = model.items.filter((item) => item.id === "course-admin");

		expect(courseEntries).toHaveLength(1);
		expect(courseEntries[0]).toMatchObject({ href: "/admin/course", children: [] });
		expect(model.items.flatMap((item) => [item.href, ...item.children.map((child) => child.href)])).not.toContain(
			"/admin/course/dashboard",
		);
	});

	it("prints the account admin route inventory for platform and course classification", () => {
		const routes = routePaths(adminRouteRoot, "/admin").sort();
		const inventory = routes.map((route) => ({
			route,
			owner: isWithinRouteTree(route, "/admin/course") ? "course-admin" : "platform",
		}));

		console.log(JSON.stringify(inventory, null, 2));
		expect(routes).toContain("/admin/course");
	});
});
