import { describe, expect, it } from "vitest";

import {
	assertLocaleCatalogCompleteness,
	assertNoForbiddenWorkspaceNouns,
	getWorkspaceLabel,
	resolveNavigation,
	validateLabelKey,
	validateNavigationRegistry,
	validateWorkspaceContext,
} from "./navigation";
import type { AppManifestEntry, NavigationCapabilities } from "./navigation";

const apps: AppManifestEntry[] = [
	{
		id: "course-user",
		appId: "course",
		scope: "app",
		displayName: "課程",
		displayNameKey: "course.navLabel",
		route: { path: "/course" },
		menu: { labelKey: "course.navLabel", icon: "book-open", order: 1 },
		requiredRole: "app-user",
		i18nNamespace: "course",
	},
	{
		id: "course-admin",
		appId: "course",
		scope: "app",
		displayName: "課程",
		displayNameKey: "course.navLabel",
		route: { path: "/admin/course" },
		menu: { labelKey: "course.navLabel", icon: "book-open", order: 10 },
		requiredRole: "app-admin",
		i18nNamespace: "course",
	},
	{
		id: "course-content",
		appId: "course",
		scope: "app",
		displayName: "課程",
		displayNameKey: "course.navLabel",
		route: { path: "/admin/course/content" },
		menu: { labelKey: "course.content", icon: "file-text", order: 10, parentId: "course-admin" },
		requiredRole: "app-admin",
		i18nNamespace: "course",
	},
	{
		id: "quiz",
		appId: "course",
		scope: "app",
		displayName: "課程",
		displayNameKey: "course.navLabel",
		route: { path: "/admin/course/quiz" },
		menu: { labelKey: "course.quiz", icon: "list-checks", order: 20, parentId: "course-admin" },
		requiredRole: "app-admin",
		i18nNamespace: "course",
	},
	{
		id: "assignment",
		appId: "course",
		scope: "app",
		displayName: "課程",
		displayNameKey: "course.navLabel",
			route: { path: "/admin/course/assignment" },
		menu: { labelKey: "course.assignment", icon: "file-pen-line", order: 30, parentId: "course-admin" },
		requiredRole: "app-admin",
		i18nNamespace: "course",
	},
	{
		id: "review",
		appId: "course",
		scope: "app",
		displayName: "課程",
		displayNameKey: "course.navLabel",
			route: { path: "/admin/course/review" },
		menu: { labelKey: "course.review", icon: "message-square", order: 40, parentId: "course-admin" },
		requiredRole: "app-admin",
		i18nNamespace: "course",
	},
	{
		id: "design-user",
		appId: "design",
		scope: "app",
		displayName: "設計",
		displayNameKey: "design.navLabel",
		route: { path: "/design" },
		menu: { labelKey: "design.navLabel", icon: "image", order: 1 },
		requiredRole: "app-user",
		i18nNamespace: "design",
	},
	{
		id: "admin-users",
		appId: "platform",
		scope: "platform",
		displayNameKey: "admin.navLabel",
		route: { path: "/admin/users" },
		menu: { labelKey: "admin.menu.users", icon: "users", order: 10 },
		requiredRole: "platform-admin",
		i18nNamespace: "admin",
	},
];

const capabilities = (overrides: Partial<NavigationCapabilities> = {}): NavigationCapabilities => ({
	userId: "user-1",
	platformAdmin: false,
	appRoles: { course: "app-user", design: "app-user" },
	...overrides,
});

describe("WorkspaceContext validation", () => {
	it("rejects missing scope", () => {
		expect(() => validateWorkspaceContext({})).toThrow(/scope/);
	});

	it("rejects app scope without appId", () => {
		expect(() => validateWorkspaceContext({ scope: "app", role: "app-user" })).toThrow(/appId/);
	});

	it("rejects an appId that is not registered", () => {
		expect(() =>
			validateWorkspaceContext({ scope: "app", appId: "missing", role: "app-user" }, apps),
		).toThrow(/missing/);
	});
});

describe("resolveNavigation", () => {
	it("selects the app-user workspace without admin items", () => {
		const model = resolveNavigation({ pathname: "/course", capabilities: capabilities(), apps });

		expect(model.workspace).toEqual({ scope: "app", appId: "course", role: "app-user" });
		expect(model.workspaceLabel).toBe("使用者");
		expect(model.items.map((item) => item.id)).toEqual(["course-user"]);
	});

	it("selects one app-admin parent with ordered children", () => {
		const model = resolveNavigation({
			pathname: "/admin/course",
			capabilities: capabilities({ appRoles: { course: "app-admin", design: "app-user" } }),
			apps,
		});

		expect(model.workspace).toEqual({ scope: "app", appId: "course", role: "app-admin" });
		expect(model.items).toHaveLength(1);
		expect(model.items[0]?.id).toBe("course-admin");
		expect(model.items[0]?.children.map((item) => item.id)).toEqual([
			"course-content",
			"quiz",
			"assignment",
			"review",
		]);
	});

	it("selects platform scope and exposes each app as one entry", () => {
		const model = resolveNavigation({
			pathname: "/admin/users",
			capabilities: capabilities({ platformAdmin: true }),
			apps,
		});

		expect(model.workspace).toEqual({ scope: "platform" });
		expect(model.workspaceLabel).toBe("總管理員");
		expect(model.items.map((item) => item.id)).toEqual(["design-user", "admin-users", "course-admin"]);
		expect(model.items.find((item) => item.id === "course-admin")?.children).toEqual([]);
	});

	it("resolves roles per app for the same user", () => {
		const userCapabilities = capabilities({ appRoles: { course: "app-admin", design: "app-user" } });
		const course = resolveNavigation({ pathname: "/admin/course", capabilities: userCapabilities, apps });
		const design = resolveNavigation({ pathname: "/design", capabilities: userCapabilities, apps });

		expect(course.workspace).toEqual({ scope: "app", appId: "course", role: "app-admin" });
		expect(design.workspace).toEqual({ scope: "app", appId: "design", role: "app-user" });
	});

	it("keeps an app-user route as app-user for a platform admin", () => {
		const model = resolveNavigation({
			pathname: "/design",
			capabilities: capabilities({ platformAdmin: true }),
			apps,
		});

		expect(model.workspace).toEqual({ scope: "app", appId: "design", role: "app-user" });
	});
});

describe("navigation registry validation", () => {
	it("rejects duplicate ids and hrefs before rendering", () => {
		expect(() => validateNavigationRegistry([{ ...apps[0]!, id: "course-user-copy" }, ...apps])).toThrow(
			/course-user/,
		);
		expect(() => validateNavigationRegistry([{ ...apps[0]!, route: { path: "/course" } }, ...apps])).toThrow(
			/course-user/,
		);
	});

	it("rejects a child that references an unknown parent", () => {
		expect(() =>
			validateNavigationRegistry([
				{ ...apps[2]!, menu: { ...apps[2]!.menu!, parentId: "missing-parent" } },
				...apps.slice(0, 2),
				...apps.slice(3),
			]),
		).toThrow(/missing-parent/);
	});
});

describe("labels and catalog contracts", () => {
	it("resolves visible workspace labels", () => {
		expect(getWorkspaceLabel({ scope: "platform" }, "Platform")).toBe("總管理員");
		expect(getWorkspaceLabel({ scope: "app", appId: "course", role: "app-admin" }, "課程")).toBe("課程管理員");
		expect(getWorkspaceLabel({ scope: "app", appId: "course", role: "app-user" }, "課程")).toBe("使用者");
	});

	it("rejects raw display strings and accepts key-shaped labels", () => {
		expect(() => validateLabelKey("課程管理")).toThrow(/labelKey/);
		expect(() => validateLabelKey("")).toThrow(/labelKey/);
		expect(() => validateLabelKey("nav.course.admin", ["course.navLabel", "admin.menu.users"])).toThrow(
			/nav.course.admin/,
		);
		expect(() => validateLabelKey("course.navLabel", ["course.navLabel"])).not.toThrow();
	});

	it("rejects forbidden visible role nouns", () => {
		expect(() => assertNoForbiddenWorkspaceNouns("學員" )).toThrow(/學員/);
		expect(() => assertNoForbiddenWorkspaceNouns("使用者")).not.toThrow();
	});

	it("requires every registered key in all supported locale catalogs", () => {
		const catalogs = {
			"zh-tw": { course: { navLabel: "課程" } },
			"zh-cn": { course: { navLabel: "课程" } },
			en: { course: { navLabel: "Courses" } },
		};
		expect(() => assertLocaleCatalogCompleteness(["course.navLabel"], catalogs)).not.toThrow();
		expect(() =>
			assertLocaleCatalogCompleteness(["design.navLabel"], catalogs),
		).toThrow(/en:design.navLabel/);
	});
});
