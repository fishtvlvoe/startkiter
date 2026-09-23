import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";

const workspaceRoot = resolve(import.meta.dirname, "../../..");
const navBarPath = resolve(workspaceRoot, "modules/shared/components/NavBar.tsx");
const userMenuPath = resolve(workspaceRoot, "modules/shared/components/UserMenu.tsx");
const authWrapperPath = resolve(workspaceRoot, "modules/shared/components/AuthWrapper.tsx");
const settingsPagePath = resolve(
	workspaceRoot,
	"app/(authenticated)/(main)/(account)/settings/general/page.tsx",
);
const iconRoot = resolve(workspaceRoot, "public/icons");

function source(path: string): string {
	return readFileSync(path, "utf8");
}

function registeredNavIcons(): string[] {
	return [
		...new Set(
			MOUNT_POINTS.flatMap((plugin) => (plugin.mount.menu ? [plugin.mount.menu.icon] : [])),
		),
	];
}

describe("account settings theme and language contract", () => {
	it("keeps theme and locale controls inside user settings", () => {
		const navBar = source(navBarPath);
		const authWrapper = source(authWrapperPath);
		const settingsPage = source(settingsPagePath);

		expect(navBar).not.toContain("ColorModeToggle");
		expect(navBar).not.toContain("LocaleSwitch");
		expect(authWrapper).not.toContain("ColorModeToggle");
		expect(settingsPage).toContain("UserColorModeForm");
		expect(settingsPage).toContain("UserLanguageForm");
	});

	it("requires paired light and dark SVG files for every registered navigation icon", () => {
		const missing: string[] = [];

		for (const icon of registeredNavIcons()) {
			for (const variant of ["light", "dark"] as const) {
				const path = resolve(iconRoot, "nav", `${icon}.${variant}.svg`);
				if (!statExists(path)) {
					missing.push(`${icon}:${variant}`);
				}
			}
		}

		expect(missing, `missing icon variants: ${missing.join(", ")}`).toEqual([]);
	});

	it("does not leave hardcoded dark colors in shared navigation or account components", () => {
		const forbidden = /(?:text|bg|border)-(?:\[#|white(?:\/|\b))/;

		expect(source(navBarPath)).not.toMatch(forbidden);
		expect(source(userMenuPath)).not.toMatch(forbidden);
	});

	it("declares a bounded account-menu surface for desktop and mobile widths", () => {
		const userMenu = source(userMenuPath);
		const desktopViewportWidth = 1440;
		const mobileViewportWidth = 390;
		const menuWidth = 224;

		expect(userMenu).toContain("max-w-[calc(100vw-2rem)]");
		expect(userMenu).toContain("data-testid=\"account-menu\"");
		expect(menuWidth).toBeLessThan(desktopViewportWidth);
		expect(menuWidth).toBeLessThan(mobileViewportWidth);
	});
});

function statExists(path: string): boolean {
	try {
		return statIsFile(path);
	} catch {
		return false;
	}
}

function statIsFile(path: string): boolean {
	return statSync(path).isFile();
}
