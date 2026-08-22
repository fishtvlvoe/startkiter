import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	usePathname: () => "/marketplace",
	useRouter: () => ({ refresh: () => {}, push: () => {}, replace: () => {} }),
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
	useLocale: () => "zh-tw",
}));

vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
}));

vi.mock("@auth/hooks/use-session", () => ({
	useSession: () => ({
		user: { id: "u1", name: "Test User", email: "learner@example.com", image: null },
	}),
}));

const getSessionMock = vi.fn();

vi.mock("@auth/lib/server", () => ({
	getSession: () => getSessionMock(),
	getOrganizationList: async () => [],
}));

vi.mock("@organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("@shared/components/PermixProvider", () => ({
	usePermissions: () => ({
		check: () => false,
	}),
}));

vi.mock("@shared/hooks/use-media-query", () => ({
	useIsMobile: () => false,
}));

vi.mock("@startkiter/auth/config", () => ({
	config: {
		organizations: { enable: false, hideOrganization: true, requireOrganization: false },
		users: {},
	},
}));

vi.mock("@startkiter/payments/config", () => ({
	config: {
		billingAttachedTo: "user",
		requireActiveSubscription: false,
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		order: {
			findMany: async () => [],
		},
	},
}));

const getRepoVersionMock = vi.fn();

vi.mock("@startkiter/github-kit", () => ({
	createGithubVersionFileReader: () => ({ readStartkiterVersion: async () => null }),
	getRepoVersion: (...args: unknown[]) => getRepoVersionMock(...args),
}));

vi.mock("../../../../modules/shared/lib/sidebar-layout", () => ({
	useSidebarLayout: () => ({ groups: [], items: [], isLoading: false }),
	useSaveSidebarLayout: () => ({ mutate: () => {} }),
}));

vi.mock("../../../../lib/github-kit", () => ({
	loadGithubKitRuntime: () => ({ config: {}, oauthConfigured: true }),
	createPrismaGrantStore: () => ({}),
}));

vi.mock("@i18n/lib/update-locale", () => ({
	updateLocale: async () => {},
}));

vi.mock("@startkiter/i18n", () => ({
	config: {
		locales: {
			"zh-tw": { label: "繁體中文" },
			"zh-cn": { label: "简体中文" },
			en: { label: "English" },
		},
	},
}));

vi.mock("@shared/components/NotificationCenter", () => ({
	NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

import MarketplacePage from "./page";

describe("Marketplace page (Phase 4 Tasks 21.1–21.4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: { id: "u1", name: "Test User", email: "learner@example.com" },
			session: { id: "s1", activeOrganizationId: null },
		});
		getRepoVersionMock.mockResolvedValue({
			ok: true,
			body: { buyerVersion: "1.0.0", latestVersion: "1.0.0", upToDate: true, syncPromptHint: "" },
		});
	});

	it("21.1 signed-in user sees the course plugin with name, version, and enabled status", async () => {
		const content = await MarketplacePage();
		const html = renderToStaticMarkup(content);

		expect(html).toMatch(/課程/);
		expect(html).toMatch(/0\.1\.0|version/i);
		expect(html).toMatch(/enabled|已啟用/i);
		expect(html).toContain("course");
	});

	it("21.2 unauthenticated visitor redirects to /login?next=/marketplace", async () => {
		getSessionMock.mockResolvedValue(null);

		await expect(MarketplacePage()).rejects.toThrow("REDIRECT:/login?next=/marketplace");
	});

	it("21.3 marketplace page has no install/uninstall action buttons", async () => {
		const content = await MarketplacePage();
		const html = renderToStaticMarkup(content);
		const rootStart = html.indexOf('data-testid="marketplace-root"');
		expect(rootStart).toBeGreaterThanOrEqual(0);
		const marketplaceHtml = html.slice(rootStart);

		expect(marketplaceHtml).not.toMatch(/data-action=["'](install|uninstall)["']/i);
		expect(marketplaceHtml).not.toMatch(/>(安裝|移除|uninstall|install)</i);
		expect(marketplaceHtml).not.toMatch(/type=["']file["']/);
		expect(marketplaceHtml).not.toMatch(/安裝模組|安裝套件|解除安裝/);
	});

	it("21.4 signed-in user sees template tab with >= 2 preview cards", async () => {
		const content = await MarketplacePage();
		const html = renderToStaticMarkup(content);

		expect(html).toMatch(/模版選擇|模板選擇/);
		expect(html).toContain("course-site");
		expect(html).toContain("service-saas");
		const previewCardCount = (html.match(/data-testid="template-preview-card"/g) ?? []).length;
		expect(previewCardCount).toBeGreaterThanOrEqual(2);
	});

	it("39.1 version section hidden sync prompt when repository is up to date", async () => {
		getRepoVersionMock.mockResolvedValue({
			ok: true,
			body: { buyerVersion: "1.0.0", latestVersion: "1.0.0", upToDate: true, syncPromptHint: "" },
		});

		const content = await MarketplacePage();
		const html = renderToStaticMarkup(content);

		expect(html).toMatch(/已是最新|up to date/i);
		expect(html).not.toContain('data-testid="sync-prompt-hint"');
	});

	it("39.2 version section shows copyable sync prompt when repository is behind", async () => {
		getRepoVersionMock.mockResolvedValue({
			ok: true,
			body: {
				buyerVersion: "1.0.0",
				latestVersion: "1.1.0",
				upToDate: false,
				syncPromptHint: "git remote add startkiter-upstream https://github.com/org/kit-template.git",
			},
		});

		const content = await MarketplacePage();
		const html = renderToStaticMarkup(content);

		expect(html).toMatch(/落後|behind/i);
		expect(html).toContain('data-testid="sync-prompt-hint"');
		expect(html).toContain("git remote add startkiter-upstream");
	});
});
