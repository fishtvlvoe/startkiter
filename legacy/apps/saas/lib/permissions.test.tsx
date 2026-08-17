import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) =>
		createElement("a", { href, ...props }, children),
}));

vi.mock("../app/components/locale-switcher", () => ({
	LocaleSwitcher: () => createElement("span", { "data-test": "locale-switcher" }),
}));

vi.mock("../app/components/mobile-tabbar", () => ({
	MobileTabbar: () => null,
}));

vi.mock("@startkiter/ui", () => ({
	ColorModeToggle: () => createElement("div", { "data-slot": "color-mode-toggle" }),
}));

import { AppShell } from "../app/components/app-shell";
import { createPermissionRules, type OrganizationRole } from "./permissions";

function renderShell(organizationRole?: OrganizationRole | null) {
	return renderToStaticMarkup(
		createElement(AppShell, {
			brand: "開站包",
			email: "operator@example.com",
			name: "Operator",
			locale: "zh-tw",
			current: "app",
			showOperatorSettings: true,
			organizationRole,
			heading: createElement("h1", null, "開始"),
			children: createElement("p", null, "內容"),
		}),
	);
}

describe("typed organization permissions", () => {
	it.each([
		["owner", { manageOrganization: true, manageCourseContent: true, viewOrganizationOrders: true }],
		["admin", { manageOrganization: true, manageCourseContent: true, viewOrganizationOrders: true }],
		["instructor", { manageOrganization: false, manageCourseContent: true, viewOrganizationOrders: false }],
		["user", { manageOrganization: false, manageCourseContent: false, viewOrganizationOrders: false }],
	] as const)("maps %s to the organization-tenancy matrix", (role, expected) => {
		const rules = createPermissionRules(role);

		expect(rules.manageOrganization).toBe(expected.manageOrganization);
		expect(rules.manageCourseContent).toBe(expected.manageCourseContent);
		expect(rules.viewOrganizationOrders).toBe(expected.viewOrganizationOrders);
	});

	it("shows course-content navigation only to an instructor", () => {
		const html = renderShell("instructor");

		expect(html).toContain('data-slot="course-admin"');
		expect(html).not.toContain('href="/admin/settings"');
	});

	it("shows all permission-gated navigation to an owner", () => {
		const html = renderShell("owner");

		expect(html).toContain('data-slot="course-admin"');
		expect(html).toContain('href="/admin/settings"');
	});

	it("fails closed when the role cannot be resolved", () => {
		const html = renderShell(null);

		expect(html).not.toContain('data-slot="course-admin"');
		expect(html).not.toContain('href="/admin/settings"');
	});
});
