import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
	usePathname: () => usePathnameMock(),
}));

const adminLayout = readFileSync(resolve(import.meta.dirname, "layout.tsx"), "utf8");
const accountSettingsLayout = readFileSync(
	resolve(import.meta.dirname, "../settings/layout.tsx"),
	"utf8",
);
const appWrapper = readFileSync(
	resolve(import.meta.dirname, "../../../../../modules/shared/components/AppWrapper.tsx"),
	"utf8",
);

describe("admin layout navigation surface", () => {
	it("does not mount the parallel SettingsMenu or its duplicated menu literals", () => {
		expect(adminLayout).not.toContain("SettingsMenu");
		expect(adminLayout).not.toContain("courseMenuItem");
		expect(adminLayout).not.toContain("coursePackMenuItem");
	});

	it("keeps SettingsMenu in the account settings layout", () => {
		expect(accountSettingsLayout).toContain("SettingsMenu");
	});

	it("keeps the admin content container fluid at a 390px mobile viewport", () => {
		const mobileViewportWidth = 390;
		const mainClass = appWrapper.match(/<main className="([^"]+)"/)?.[1] ?? "";
		const fixedWidths = [...mainClass.matchAll(/(?:^|\s)(?:md:)?w-\[(\d+)px\]/g)].map(([, width]) =>
			Number(width),
		);

		expect(mainClass).toContain("w-full");
		expect(mainClass).not.toContain("overflow-x");
		expect(fixedWidths.every((width) => width <= mobileViewportWidth)).toBe(true);
	});

	it("uses AdminLayoutHeader instead of direct PageHeader in admin layout", () => {
		expect(adminLayout).toContain("AdminLayoutHeader");
		expect(adminLayout).not.toMatch(/<PageHeader\b/);
	});
});

describe("AdminLayoutHeader", () => {
	it("pathname 是 /admin/dashboard 時輸出空字串，是 /admin/course/dashboard 時輸出含「後台管理」", async () => {
		const { AdminLayoutHeader } = await import(
			"../../../../../modules/shared/components/AdminLayoutHeader"
		);
		usePathnameMock.mockReturnValue("/admin/dashboard");
		const dashboardHtml = renderToStaticMarkup(
			React.createElement(AdminLayoutHeader, {
				title: "後台管理",
				subtitle: "管理你的應用程式。",
			}),
		);
		expect(dashboardHtml).toBe("");

		usePathnameMock.mockReturnValue("/admin/course/dashboard");
		const courseDashboardHtml = renderToStaticMarkup(
			React.createElement(AdminLayoutHeader, {
				title: "後台管理",
				subtitle: "管理你的應用程式。",
			}),
		);
		expect(courseDashboardHtml).toContain("後台管理");
	});

	it("pathname 是 /admin/dashboard/（帶結尾斜線）時亦輸出空字串", async () => {
		const { AdminLayoutHeader } = await import(
			"../../../../../modules/shared/components/AdminLayoutHeader"
		);
		usePathnameMock.mockReturnValue("/admin/dashboard/");
		const dashboardHtml = renderToStaticMarkup(
			React.createElement(AdminLayoutHeader, {
				title: "後台管理",
				subtitle: "管理你的應用程式。",
			}),
		);
		expect(dashboardHtml).toBe("");
	});
});
