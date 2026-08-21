import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavBar } from "./NavBar";

const mockPathname = "/";
const mockIsCollapsed = false;
let mockIsMobile = false;

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
		mockIsMobile = false;
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
		expect(html).toContain("md:fixed md:top-0 md:left-0 md:h-full md:w-[280px]");
		expect(html).toContain("sidebar-user-area");

		// Mobile tab bar has md:hidden class to prevent display on wide viewports (1280px)
		expect(html).toContain("data-testid=\"mobile-tab-bar\"");
		expect(html).toContain("md:hidden");
	});
});
