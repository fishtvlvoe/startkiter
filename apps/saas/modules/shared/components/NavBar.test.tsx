import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavBar } from "./NavBar";

const mockPathname = "/";
const mockIsCollapsed = false;
const mockIsMobile = false;

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
		check: () => false,
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
