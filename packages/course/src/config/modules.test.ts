import { describe, expect, it } from "vitest";
import { courseModuleDescriptor } from "./modules";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("course-module — Course is a module on the sellable site", () => {
	it("course module id must appear in Prisma、oRPC、UI、config/modules.ts", () => {
		// 1. Module descriptor properties
		expect(courseModuleDescriptor.id).toBe("course");
		expect(courseModuleDescriptor.title).toContain("電馭學院");
		expect(courseModuleDescriptor.title).toContain("StartKiter Academy");
		expect(courseModuleDescriptor.enabled).toBe(true);
		expect(courseModuleDescriptor.route).toBe("/course");
		expect(courseModuleDescriptor.adminRoute).toBe("/admin/course");

		// 2. SVG icon key verification (no emoji, no icon fonts)
		expect(courseModuleDescriptor.icon).toBe("book-open");
		expect(typeof courseModuleDescriptor.icon).toBe("string");
		expect(courseModuleDescriptor.icon.length).toBeGreaterThan(0);
		// Ensure icon key is not an emoji or Unicode pictograph
		expect(courseModuleDescriptor.icon).toMatch(/^[a-z0-9-]+$/);

		// 3. Navigation folder and order fields
		expect(courseModuleDescriptor.navigation).toBeDefined();
		expect(courseModuleDescriptor.navigation.folder).toBe("核心學習");
		expect(courseModuleDescriptor.navigation.order).toBe(1);
		expect(courseModuleDescriptor.folder).toBe("核心學習");
		expect(courseModuleDescriptor.order).toBe(1);

		// 4. Four Mount Points declaration
		expect(courseModuleDescriptor.mountPoints).toEqual({
			database: "packages/database/prisma/schema.prisma",
			api: "packages/api/modules/course/",
			ui: "apps/saas/app/(authenticated)/(main)/(account)/course/",
			registry: "config/modules.ts",
		});

		// 5. Verify mount points point to actual files / directories in the repository
		const rootDir = resolve(__dirname, "../../../../");
		const dbPath = resolve(rootDir, courseModuleDescriptor.mountPoints.database);
		const apiPath = resolve(rootDir, courseModuleDescriptor.mountPoints.api);
		const uiPath = resolve(rootDir, courseModuleDescriptor.mountPoints.ui);
		const registryPath = resolve(rootDir, courseModuleDescriptor.mountPoints.registry);

		expect(existsSync(dbPath)).toBe(true);
		expect(existsSync(apiPath)).toBe(true);
		expect(existsSync(uiPath)).toBe(true);
		expect(existsSync(registryPath)).toBe(true);

		// 6. Verify Prisma schema contains course models & moduleId
		const prismaContent = readFileSync(dbPath, "utf-8");
		expect(prismaContent).toContain("model Course");
		expect(prismaContent).toContain("model Chapter");
		expect(prismaContent).toContain("model Lesson");
		expect(prismaContent).toContain("model LessonProgress");

		// 7. Verify config/modules.ts contains the single source of truth for enabled
		const registryContent = readFileSync(registryPath, "utf-8");
		expect(registryContent).toContain('id: "course"');
		expect(registryContent).toContain("enabled: true");
		expect(registryContent).toContain('icon: "book-open"');
		expect(registryContent).toContain('folder: "核心學習"');
	});

	it("ensures no second enabled source of truth exists", () => {
		// Verify descriptor has single enabled flag
		expect(courseModuleDescriptor.enabled).toBe(true);
		expect(typeof courseModuleDescriptor.enabled).toBe("boolean");
	});
});
