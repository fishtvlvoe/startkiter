import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOUNT_POINTS } from "@startkiter/platform";
import { iconMap, NavBar, resolveIcon } from "./NavBar";
import { PagesCmsAccessProvider } from "./PagesCmsAccessProvider";

let mockPathname = "/";
let mockIsCollapsed = false;
let mockIsMobile = false;
let mockSidebarGroups: Array<{ id: string; title: string; order: number; isCollapsed: boolean }> = [];
let mockCanAccessAdmin = false;

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname,
	useRouter: () => ({ refresh: () => {}, push: () => {}, replace: () => {} }),
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
	useLocale: () => "zh-tw",
}));

vi.mock("@auth/hooks/use-session", () => ({
	useSession: () => ({
		user: { id: "u1", name: "Test User", email: "test@example.com", image: null },
	}),
}));

vi.mock("@organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("@shared/components/PermixProvider", () => ({
	usePermissions: () => ({
		check: (perm: string) => (perm === "admin.access" ? mockCanAccessAdmin : false),
	}),
}));

vi.mock("../lib/sidebar-context", () => ({
	useSidebar: () => ({
		isCollapsed: mockIsCollapsed,
		toggleCollapsed: () => {},
	}),
}));

vi.mock("../hooks/use-media-query", () => ({
	useIsMobile: () => mockIsMobile,
}));

vi.mock("../lib/sidebar-layout", () => ({
	useSidebarLayout: () => ({ groups: mockSidebarGroups, items: [], isLoading: false }),
	useSaveSidebarLayout: () => ({ mutate: () => {}, isPending: false }),
}));

vi.mock("@startkiter/auth/config", () => ({
	config: {
		organizations: { enable: false, hideOrganization: true },
		users: {},
	},
}));

vi.mock("@startkiter/payments/config", () => ({
	config: {
		billingAttachedTo: "user",
	},
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

describe("NavBar shell layout (Phase 2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsMobile = false;
	});

	afterEach(() => {
		mockIsCollapsed = false;
		mockSidebarGroups = [];
	});

	it("7.1 renders LocaleSwitch in the sidebar user area", () => {
		const html = renderToStaticMarkup(<NavBar />);

		// Locale switcher should be present inside the sidebar user area.
		expect(html).toContain("locale-switch");
		expect(html).toContain("sidebar-user-area");
		// Ensure the sidebar user area comes after the top bar in document order.
		const topBarEnd = html.indexOf("sidebar-user-area");
		const userAreaHtml = topBarEnd > 0 ? html.slice(topBarEnd) : html;
		expect(userAreaHtml).toContain("locale-switch");
	});

	it("7.1 renders ColorModeToggle in the top bar, not in the sidebar user area", () => {
		const html = renderToStaticMarkup(<NavBar />);

		// Color mode toggle should be present in the rendered output.
		expect(html).toContain("color-mode-toggle");
		// Locale switcher should not be in the top bar area.
		// The top bar is the first container in the NavBar output.
		const topBarEnd = html.indexOf("sidebar-user-area");
		const topBarHtml = topBarEnd > 0 ? html.slice(0, topBarEnd) : html;
		expect(topBarHtml).toContain("color-mode-toggle");
		expect(topBarHtml).not.toContain("locale-switch");
	});

	it("9.3 renders sidebar navigation at 1280px wide viewport and does not render active tab bar (md:hidden)", () => {
		mockIsMobile = false;
		const html = renderToStaticMarkup(<NavBar />);

		// Desktop sidebar nav structure is present
		expect(html).toContain("md:fixed md:top-8 md:left-0 md:h-[calc(100%-2rem)] md:w-[280px]");
		expect(html).toContain("sidebar-user-area");

		// Mobile tab bar has md:hidden class to prevent display on wide viewports (1280px)
		expect(html).toContain("data-testid=\"mobile-tab-bar\"");
		expect(html).toContain("md:hidden");
	});

	it("49.2 renders sidebar edge resize handle with correct positioning and hover visibility classes", () => {
		const html = renderToStaticMarkup(<NavBar />);

		// Sidebar edge handle button should be present
		expect(html).toContain("data-testid=\"sidebar-edge-toggle\"");
		expect(html).toContain("cursor-col-resize");
		expect(html).toContain("md:w-4");
		expect(html).toContain("md:translate-x-1/2");

		// Handle chip should be opacity-0 by default, visible on group-hover and group-focus-visible
		expect(html).toContain("opacity-0");
		expect(html).toContain("group-hover:opacity-100");
		expect(html).toContain("group-focus-visible:opacity-100");
		// Must not use group-focus-within which causes the handle to stay stuck visible after pointer interaction
		expect(html).not.toContain("group-focus-within:opacity-100");
	});
});

describe("WordPress Admin 視覺 Shell（Phase 9, task 45 紅燈）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsMobile = false;
	});

	afterEach(() => {
		mockIsCollapsed = false;
		mockSidebarGroups = [];
		mockPathname = "/";
		mockCanAccessAdmin = false;
	});

	it("45.1 頂列 admin bar 固定 32px（h-8）並使用 WP 配色 token（#1d2327 深色背景、#2271b1 active）", () => {
		mockPathname = "/app";
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain('data-testid="admin-bar"');
		expect(html).toContain("h-8");
		expect(html).toContain("#1d2327");
		expect(html).toContain("#2271b1");
	});

	it("45.2a 側邊欄收折後寬度為 56px（md:w-14），不是舊的 80px", () => {
		mockIsCollapsed = true;
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain("md:w-14");
		expect(html).not.toContain("md:w-[80px]");
	});

	it("hides 頁面管理 for role=admin when pages-cms access is false", () => {
		mockCanAccessAdmin = true;
		const html = renderToStaticMarkup(<NavBar />);
		expect(html).toContain("課程綁定包");
		expect(html).not.toContain("頁面管理");
	});

	it("shows 頁面管理 when canAccessPagesCmsAdmin is true even without admin.access", () => {
		mockCanAccessAdmin = false;
		const html = renderToStaticMarkup(
			<PagesCmsAccessProvider canAccessPagesCms={true}>
				<NavBar />
			</PagesCmsAccessProvider>,
		);
		expect(html).toContain("頁面管理");
		expect(html).not.toContain("課程綁定包");
	});

	it("45.2b 單一分組可獨立收折，跟整體側邊欄收折狀態互不影響", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockSidebarGroups = [
			{ id: "g1", title: "SYSTEM", order: 0, isCollapsed: true },
			{ id: "g2", title: "GENERAL", order: 1, isCollapsed: false },
		];
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain('data-testid="sidebar-group-g1"');
		expect(html).toContain('data-sidebar-group-collapsed="true"');
		expect(html).toContain('data-testid="sidebar-group-g2"');
		expect(html).toContain('data-sidebar-group-collapsed="false"');
	});
});

describe("NavBar iconMap & resolveIcon coverage", () => {
	it("every MOUNT_POINTS icon has a matching entry in iconMap", () => {
		const mountIcons = MOUNT_POINTS.filter((p) => p.mount.menu).map((p) => p.mount.menu!.icon);
		expect(mountIcons.length).toBeGreaterThan(0);

		for (const icon of mountIcons) {
			expect(icon in iconMap).toBe(true);
			const IconComponent = resolveIcon(icon);
			expect(IconComponent).toBeDefined();

			const rendered = renderToStaticMarkup(React.createElement(IconComponent));
			// Should render SVG icon, not raw string fallback span
			expect(rendered).toContain("<svg");
			expect(rendered).not.toContain(`>${icon}<`);
		}
	});

	it("resolveIcon resolves package and book-open to valid SVG icons", () => {
		const PackageComp = resolveIcon("package");
		const BookOpenComp = resolveIcon("book-open");

		expect(renderToStaticMarkup(React.createElement(PackageComp))).toContain("<svg");
		expect(renderToStaticMarkup(React.createElement(BookOpenComp))).toContain("<svg");
	});

	it("resolveIcon does not render raw multi-character string on unknown key fallback", () => {
		const UnknownComp = resolveIcon("unknown-feature-key");
		const html = renderToStaticMarkup(React.createElement(UnknownComp));

		// Should NOT render span containing the long string
		expect(html).not.toContain("unknown-feature-key");
		expect(html).toContain("<svg");
	});
});
