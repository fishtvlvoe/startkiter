import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
	headers: async () => new Headers(),
	cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: async () => ({
				user: { id: "user-1", email: "operator@example.com", name: "Operator" },
			}),
		},
	},
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: ReactNode;
		[key: string]: unknown;
	}) => createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@startkiter/i18n", () => ({
	config: {
		localeCookieName: "locale",
		locales: {
			"zh-tw": { label: "繁中" },
			"zh-cn": { label: "简中" },
			en: { label: "English" },
		},
		defaultLocale: "zh-tw",
	},
	locales: ["zh-tw", "zh-cn", "en"],
	isLocale: (value: string) => ["zh-tw", "zh-cn", "en"].includes(value),
	getMessagesForLocale: async () => ({ brand: "開站包" }),
}));

vi.mock("@startkiter/ui", () => ({
	ColorModeToggle: () => createElement("div", { "data-slot": "color-mode-toggle" }),
}));

import { AppShell } from "../app/components/app-shell";
import AgentPage from "../app/agent/page";
import AdminSettingsPage from "../app/admin/settings/page";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function source(relativePath: string) {
	return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function renderShell(showOperatorSettings = false) {
	return renderToStaticMarkup(
		createElement(
			AppShell,
			{
				brand: "開站包",
				email: "operator@example.com",
				name: "Operator",
				locale: "zh-tw",
				current: "app",
				showOperatorSettings,
				heading: createElement("h1", null, "開始"),
				children: createElement("p", null, "內容"),
			},
		),
	);
}

describe("authenticated routes use AppShell", () => {
	it("renders the agent response inside the AppShell sidebar", async () => {
		const html = renderToStaticMarkup(await AgentPage());

		expect(html).toContain('data-slot="sidebar"');
		expect(html).not.toContain('class="nav"');
	});

	it("renders the settings response inside the AppShell sidebar", async () => {
		vi.stubEnv("ADMIN_EMAIL", "operator@example.com");
		const html = renderToStaticMarkup(await AdminSettingsPage());

		expect(html).toContain('data-slot="sidebar"');
		expect(html).not.toContain('class="nav"');
		vi.unstubAllEnvs();
	});

	it("uses AppShell for the agent route", () => {
		const agentSource = source("apps/saas/app/agent/page.tsx");

		expect(agentSource).toContain('import { AppShell }');
		expect(agentSource).toContain('current="agent"');
		expect(agentSource).not.toContain("SiteNav");
	});

	it("uses AppShell for the operator settings route", () => {
		const settingsSource = source("apps/saas/app/admin/settings/page.tsx");

		expect(settingsSource).toContain('import { AppShell }');
		expect(settingsSource).toContain('current="settings"');
		expect(settingsSource).not.toContain("SiteNav");
	});

	it("shows settings only to an operator in the shared navigation", () => {
		const settingsSource = source("apps/saas/app/admin/settings/page.tsx");
		const operatorHtml = renderShell(true);
		const learnerHtml = renderShell(false);

		expect(settingsSource).toContain("shouldShowOperatorSettingsLink");
		expect(settingsSource).toContain("showOperatorSettings");
		expect(operatorHtml).toContain('href="/admin/settings"');
		expect(learnerHtml).not.toContain('href="/admin/settings"');
	});
});

describe("AppShell control placement", () => {
	it("keeps locale switching in the sidebar user area and color mode in the top bar", () => {
		const html = renderShell();
		const sidebarUserIndex = html.indexOf('data-slot="sidebar-user"');
		const topBarIndex = html.indexOf('data-slot="page-header"');
		const localeIndex = html.indexOf('data-test="locale-toggle-zh-tw"');
		const colorModeIndex = html.indexOf('data-slot="color-mode-toggle"');
		const sidebarEndIndex = html.indexOf("</aside>");

		expect(sidebarUserIndex).toBeGreaterThanOrEqual(0);
		expect(topBarIndex).toBeGreaterThan(sidebarEndIndex);
		expect(localeIndex).toBeGreaterThan(sidebarUserIndex);
		expect(localeIndex).toBeLessThan(sidebarEndIndex);
		expect(colorModeIndex).toBeGreaterThan(topBarIndex);
		expect(html.slice(topBarIndex)).not.toContain("locale-toggle-");
	});
});
