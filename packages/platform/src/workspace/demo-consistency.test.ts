import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { MOUNT_POINTS } from "../mount-points";
import { toAppManifestEntries } from "./registry";

const fixturePath = resolve(process.cwd(), "../../docs/ux/startkiter-navigation-fixture.json");
const htmlPath = resolve(process.cwd(), "../../docs/ux/startkiter-sr-architecture-focus.html");

function readFixture(): {
	source: string;
	modules: Array<{
		id: string;
		appId: string;
		scope: string;
		requiredRole: string;
		href: string;
		labelKey: string;
		parentId?: string;
	}>;
	apps: Array<{ appId: string; displayName: string; displayNameKey: string; scope: string }>;
} {
	return JSON.parse(readFileSync(fixturePath, "utf8"));
}

describe("UX demo and runtime navigation contract", () => {
	it("fixture matches the registered module ids, hrefs, roles, labels, and parent relationships", () => {
		const fixture = readFixture();
		const runtimeModules = toAppManifestEntries(MOUNT_POINTS).map((entry) => ({
			id: entry.id,
			appId: entry.appId,
			scope: entry.scope,
			requiredRole: entry.requiredRole,
			href: entry.route.path,
			labelKey: entry.menu!.labelKey,
			...(entry.menu?.parentId ? { parentId: entry.menu.parentId } : {}),
		}));

		expect(fixture.source).toBe("packages/platform/src/mount-points.ts");
		expect(fixture.modules).toEqual(runtimeModules);
		expect(fixture.apps).toEqual([
			{ appId: "course", displayName: "課程", displayNameKey: "course.navLabel", scope: "app" },
			{ appId: "platform", displayName: "平台", displayNameKey: "admin.navLabel", scope: "platform" },
		]);
	});

	it("HTML reads the fixture and does not advertise unregistered demo Apps", () => {
		const html = readFileSync(htmlPath, "utf8");

		expect(html).toContain('fetch("./startkiter-navigation-fixture.json"');
		expect(html).not.toContain('data-app="design"');
		expect(html).not.toContain('data-app="community"');
		expect(html).toContain("navigationFixture.apps.filter");
	});
});
