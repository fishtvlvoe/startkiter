import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOUNT_POINTS } from "@startkiter/platform";
import * as workspaceNavigation from "@startkiter/platform/src/workspace/navigation";
import { iconMap, NavBar, NavMenuList, resolveIcon } from "./NavBar";
import { PagesCmsAccessProvider } from "./PagesCmsAccessProvider";
import * as navMenuItems from "../lib/nav-menu-items";

let mockPathname = "/";
let mockIsCollapsed = false;
let mockIsMobile = false;
let mockSidebarGroups: Array<{ id: string; title: string; order: number; isCollapsed: boolean }> = [];
let mockSidebarItems: Array<{ id: string; groupId: string; menuItemId: string; order: number }> = [];
let mockCanAccessAdmin = false;

const localStorageStore: Record<string, string> = {};
const localStorageMock = {
	getItem: (key: string) => localStorageStore[key] ?? null,
	setItem: (key: string, value: string) => {
		localStorageStore[key] = String(value);
	},
	removeItem: (key: string) => {
		delete localStorageStore[key];
	},
	clear: () => {
		for (const key of Object.keys(localStorageStore)) {
			delete localStorageStore[key];
		}
	},
};

Object.defineProperty(globalThis, "localStorage", {
	value: localStorageMock,
	configurable: true,
	writable: true,
});

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
	useSidebarLayout: () => ({ groups: mockSidebarGroups, items: mockSidebarItems, isLoading: false }),
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
		mockSidebarItems = [];
		localStorage.clear?.();
	});

	it("keeps locale controls out of the sidebar user area", () => {
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain("sidebar-user-area");
		expect(html).not.toContain("locale-switch");
	});

	it("keeps color mode controls out of the top bar and sidebar", () => {
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).not.toContain("color-mode-toggle");
		expect(html).not.toContain("LocaleSwitch");
	});

	it("renders exactly one theme switch per breakpoint (desktop + mobile, not duplicated within either) and uses surface colors in the mobile drawer", () => {
		const html = renderToStaticMarkup(<NavBar />);
		const drawerHtml = renderToStaticMarkup(
			<NavMenuList
				menuItems={[{
					id: "course",
					label: "課程",
					href: "/course",
					icon: iconMap["book-open"],
					isActive: false,
					order: 0,
					}]}
					isCollapsedEffective={false}
					adminSectionLabel="管理"
					listClassName="flex list-none flex-col"
				tone="surface"
			/>,
		);

		const toggleCount = (html.match(/data-testid="color-mode-toggle"/g) ?? []).length;
		expect(toggleCount).toBe(0);

		expect(drawerHtml).toContain('data-sidebar-variant="surface"');
		expect(drawerHtml).toContain("text-muted-foreground");
		expect(drawerHtml).toContain("hover:bg-accent/50");
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

	it("3.3 keeps the admin navigation surfaces within a 390px mobile viewport", () => {
		const mobileViewportWidth = 390;
		mockIsMobile = true;
		const html = renderToStaticMarkup(<NavBar />);

		const sidebarClass = html.match(/<nav[^>]*id="app-sidebar"[^>]*class="([^"]*)"/)?.[1] ?? "";

		// The admin shell is fluid on mobile; the desktop 280px width is breakpoint-scoped.
		expect(sidebarClass).toContain("w-full");
		expect(sidebarClass).toContain("md:w-[280px]");
		expect(sidebarClass).not.toContain("overflow-x");
		const fixedWidths = [...sidebarClass.matchAll(/(?:^|\s)(?:md:)?w-\[(\d+)px\]/g)].map(([, width]) =>
			Number(width),
		);
		expect(fixedWidths.every((width) => width <= mobileViewportWidth)).toBe(true);
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
		mockSidebarItems = [];
		mockPathname = "/";
		mockCanAccessAdmin = false;
		localStorage.clear?.();
	});

	it("45.1 頂列 admin bar 固定 32px（h-8）並使用 semantic 配色 token", () => {
		mockPathname = "/app";
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain('data-testid="admin-bar"');
		expect(html).toContain("h-8");
		expect(html).toContain("bg-background");
		expect(html).toContain("text-foreground");
		expect(html).not.toContain("#1d2327");
		expect(html).not.toContain("#2271b1");
	});

	it("45.2a 側邊欄收折後寬度為 56px（md:w-14），不是舊的 80px", () => {
		mockIsCollapsed = true;
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain("md:w-14");
		expect(html).not.toContain("md:w-[80px]");
	});

	it("hides 頁面管理 for role=admin when pages-cms access is false", () => {
		mockCanAccessAdmin = true;
		mockPathname = "/admin/course";
		const html = renderToStaticMarkup(<NavBar />);
		expect(html).toContain("course.bundles");
		expect(html).not.toContain("admin.menu.pages");
	});

	it("總管理員進入課程 App 時顯示課程管理員身份", () => {
		mockCanAccessAdmin = true;
		mockPathname = "/admin/course";
		const resolveNavigationSpy = vi.spyOn(workspaceNavigation, "resolveNavigation");
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain('data-testid="sidebar-workspace-label"');
		expect(html).toContain("課程管理員");
		expect(html).toContain("course.bundles");
		expect(resolveNavigationSpy).toHaveBeenCalledTimes(1);
		resolveNavigationSpy.mockRestore();
	});

	it("總管理員在課程 App 前台路徑也顯示課程管理員身份", () => {
		mockCanAccessAdmin = true;
		mockPathname = "/course";
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain('data-testid="sidebar-workspace-label"');
		expect(html).toContain("課程管理員");
		expect(html).toContain("app.menu.start");
		expect(html).not.toContain("course.dashboard");
	});

	it("shows 頁面管理 when canAccessPagesCmsAdmin is true even without admin.access", () => {
		mockCanAccessAdmin = false;
		mockPathname = "/admin/pages";
		const html = renderToStaticMarkup(
			<PagesCmsAccessProvider canAccessPagesCms={true}>
				<NavBar />
			</PagesCmsAccessProvider>,
		);
		expect(html).toContain("admin.menu.pages");
		expect(html).not.toContain("course.navLabel");
	});

	it("45.2b 單一分組可獨立收折，跟整體側邊欄收折狀態互不影響", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockSidebarGroups = [
			{ id: "g1", title: "SYSTEM", order: 0, isCollapsed: true },
			{ id: "g2", title: "GENERAL", order: 1, isCollapsed: false },
		];
		const flatMenuSpy = vi.spyOn(navMenuItems, "getMountMenuItems").mockReturnValue([
			{ id: "start", label: "開始", href: "/app", icon: "home", order: 0, isActive: false },
			{
				id: "admin",
				label: "後台設定",
				href: "/admin/users",
				icon: "shield-user",
				order: 4,
				isActive: false,
				requiresOperator: true,
			},
		]);
		const html = renderToStaticMarkup(<NavBar />);
		flatMenuSpy.mockRestore();

		expect(html).toContain('data-testid="sidebar-group-g1"');
		expect(html).toContain('data-sidebar-group-collapsed="true"');
		expect(html).toContain('data-testid="sidebar-group-g2"');
		expect(html).toContain('data-sidebar-group-collapsed="false"');
	});

	it("renders operator admin section in grouped sidebar nav when nested course menu is present", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/users";
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain('data-testid="sidebar-group-admin-section"');
		expect(html).toContain("app.menu.admin");
		expect(html).toContain("admin.menu.users");
		expect(html).toContain("course.navLabel");
	});

	it("uses SidebarGroupedNav with nested course admin menu for operators", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/course/media";
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain("course.coursePack");
		expect(html).toContain('data-testid="sidebar-group-unassigned"');
		expect(html).toContain("course.media");
	});

	it("keeps grouped sidebar nav when an operator menu item has subItems", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/settings/checkout-gateway";
		const menuSpy = vi.spyOn(navMenuItems, "getMountMenuItems").mockReturnValue([
			{
				id: "start",
				label: "開始",
				href: "/app",
				icon: "home",
				order: 0,
				isActive: false,
			},
			{
				id: "admin-gateway-config",
				label: "admin.menu.gateway",
				href: "/admin/settings/checkout-gateway",
				icon: "settings",
				order: 1,
				isActive: false,
				requiresOperator: true,
				subItems: [
					{
						id: "admin-checkout-gateway",
						label: "收款閘道設定",
						href: "/admin/settings/checkout-gateway",
					},
				],
			},
		]);
		const html = renderToStaticMarkup(<NavBar />);
		menuSpy.mockRestore();

		expect(html).toContain('data-testid="sidebar-group-unassigned"');
		expect(html).toContain('data-testid="sidebar-group-item-admin-gateway-config"');
		expect(html).toContain("收款閘道設定");
		expect(html).toContain('href="/admin/settings/checkout-gateway"');
	});

	it("highlights 郵件設定 on /admin/email-settings via NavMenuList", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/email-settings";
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).toContain("admin.menu.emailSettings");
		expect(html).toContain("bg-accent");
	});

	it("does not render operator admin section when user is not operator", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = false;
		mockPathname = "/course";
		const html = renderToStaticMarkup(<NavBar />);

		expect(html).not.toContain('data-testid="sidebar-group-admin-section"');
		expect(html).not.toContain("admin.menu.users");
		expect(html).toContain("app.menu.start");
		expect(html).toContain("course.navLabel");
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
			// Should load the paired SVG asset, not render a raw string fallback span.
			expect(rendered).toContain(`/icons/nav/${icon}.light.svg`);
			expect(rendered).not.toContain(`>${icon}<`);
		}
	});

	it("resolveIcon resolves package and book-open to valid SVG icons", () => {
		const PackageComp = resolveIcon("package");
		const BookOpenComp = resolveIcon("book-open");

		expect(renderToStaticMarkup(React.createElement(PackageComp))).toContain("/icons/nav/package.light.svg");
		expect(renderToStaticMarkup(React.createElement(BookOpenComp))).toContain("/icons/nav/book-open.light.svg");
	});

	it("resolveIcon does not render raw multi-character string on unknown key fallback", () => {
		const UnknownComp = resolveIcon("unknown-feature-key");
		const html = renderToStaticMarkup(React.createElement(UnknownComp));

		// Should NOT render span containing the long string
		expect(html).not.toContain("unknown-feature-key");
		expect(html).toContain("/icons/nav/package.light.svg");
	});
});

describe("Admin 側邊欄五分區與可展開子選單（Task 1.2 紅燈測試）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsMobile = false;
		mockIsCollapsed = false;
		mockSidebarGroups = [];
		mockSidebarItems = [];
		mockPathname = "/";
		mockCanAccessAdmin = false;
		localStorage.clear();
	});

	afterEach(() => {
		mockIsCollapsed = false;
		mockSidebarGroups = [];
		mockSidebarItems = [];
		mockPathname = "/";
		mockCanAccessAdmin = false;
		localStorage.clear();
	});

	it("1.2a 依固定順序渲染五個分區（core, content, members, billing, system）並移除單一「管理」標題", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/email-settings";

		const html = renderToStaticMarkup(<NavBar />);

		// 移除舊的單一「管理」標題與分區容器
		expect(html).not.toContain('data-testid="sidebar-group-admin-section"');
		expect(html).not.toContain("app.menu.admin");

		// 五個預設分區存在
		expect(html).toContain('data-testid="sidebar-section-core"');
		expect(html).toContain('data-testid="sidebar-section-content"');
		expect(html).toContain('data-testid="sidebar-section-members"');
		expect(html).toContain('data-testid="sidebar-section-billing"');
		expect(html).toContain('data-testid="sidebar-section-system"');

		// 依固定順序排序：core -> content -> members -> billing -> system
		const corePos = html.indexOf('data-testid="sidebar-section-core"');
		const contentPos = html.indexOf('data-testid="sidebar-section-content"');
		const membersPos = html.indexOf('data-testid="sidebar-section-members"');
		const billingPos = html.indexOf('data-testid="sidebar-section-billing"');
		const systemPos = html.indexOf('data-testid="sidebar-section-system"');

		expect(corePos).toBeGreaterThan(-1);
		expect(contentPos).toBeGreaterThan(corePos);
		expect(membersPos).toBeGreaterThan(contentPos);
		expect(billingPos).toBeGreaterThan(membersPos);
		expect(systemPos).toBeGreaterThan(billingPos);

		// 各分區包含對應項目
		expect(html).toContain("course.dashboard");
		expect(html).toContain("course.navLabel");
		expect(html).toContain("admin.menu.pages");
		expect(html).toContain("admin.menu.users");
		expect(html).toContain("admin.menu.organizations");
		expect(html).toContain("admin.menu.newsletter");
		expect(html).toContain("admin.menu.orders");
		expect(html).toContain("admin.menu.revenue");
		expect(html).toContain("admin.menu.systemSettings");
	});

	it("1.2b 使用者自建分組優先於預設分區（拖入自建分組的項目不再出現在預設分區）", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/orders";
		mockSidebarGroups = [
			{ id: "custom-group-1", title: "營運常用", order: 0, isCollapsed: false },
		];
		mockSidebarItems = [
			{ id: "assigned-orders", groupId: "custom-group-1", menuItemId: "admin-orders", order: 0 },
		];

		const html = renderToStaticMarkup(<NavBar />);

		// 自建分組存在且包含「訂單管理」
		expect(html).toContain('data-testid="sidebar-group-custom-group-1"');
		expect(html).toContain('data-testid="sidebar-group-item-admin-orders"');

		// billing 分區依然渲染其餘項目（營收報表），但不包含「訂單管理」
		expect(html).toContain('data-testid="sidebar-section-billing"');
		expect(html).toContain("admin.menu.revenue");

		const billingSectionHtml =
			html.split('data-testid="sidebar-section-billing"')[1]?.split('data-testid="sidebar-section-')[0] ?? "";
		expect(billingSectionHtml).toContain("admin.menu.revenue");
		expect(billingSectionHtml).not.toContain('data-testid="sidebar-group-item-admin-orders"');
		expect(billingSectionHtml).not.toContain("admin.menu.orders");
	});

	it("1.2c 分區標題可點擊收合，收合時隱藏其項目且其他分區保持可見", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/users";

		// 預設展開時：分區標題具備收合按鈕控制項，且項目正常顯示
		const expandedHtml = renderToStaticMarkup(<NavBar />);
		expect(expandedHtml).toContain('data-testid="sidebar-section-toggle-billing"');
		expect(expandedHtml).toContain('data-testid="sidebar-section-billing"');
		expect(expandedHtml).toContain('data-sidebar-section-collapsed="false"');
		expect(expandedHtml).toContain("admin.menu.orders");
		expect(expandedHtml).toContain("admin.menu.revenue");

		// 收合 billing 分區
		localStorage.setItem("startkiter:sidebar-collapsed-sections", JSON.stringify(["billing"]));
		const collapsedHtml = renderToStaticMarkup(<NavBar />);

		// billing 分區標記為收合狀態，其子項目被隱藏
		expect(collapsedHtml).toContain('data-testid="sidebar-section-billing"');
		expect(collapsedHtml).toContain('data-sidebar-section-collapsed="true"');
		const billingSectionHtml =
			collapsedHtml.split('data-testid="sidebar-section-billing"')[1]?.split('data-testid="sidebar-section-')[0] ?? "";
		expect(billingSectionHtml).not.toContain("admin.menu.orders");
		expect(billingSectionHtml).not.toContain("admin.menu.revenue");

		// 其他分區（如 members 與 core）依然展開且可見
		expect(collapsedHtml).toContain("admin.menu.users");
		expect(collapsedHtml).toContain("course.dashboard");
	});

	it("1.2d 點「課程」切換展開子選單而不換頁，展開後顯示完整的 11 個課程子項", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/users";

		localStorage.setItem("startkiter:sidebar-expanded-submenus", JSON.stringify(["course-admin"]));
		const html = renderToStaticMarkup(<NavBar />);

		// 頂層「課程」項目是不直接導向 /admin/course 的展開按鈕（點擊不換頁）
		expect(html).toContain('data-testid="sidebar-item-toggle-course-admin"');
		const courseToggleHtml = html.match(/<[^>]*data-testid="sidebar-item-toggle-course-admin"[^>]*>/)?.[0] ?? "";
		expect(courseToggleHtml).not.toContain('href="/admin/course"');

		// 子選單展開且包含全部 11 個課程子項目
		// 1. 課程列表 (self route: /admin/course)
		expect(html).toContain('href="/admin/course"');
		expect(html).toContain("course.list");
		// 2. 測驗管理
		expect(html).toContain('href="/admin/course/quiz"');
		expect(html).toContain("course.quiz");
		// 3. 作業管理
		expect(html).toContain('href="/admin/course/assignment"');
		expect(html).toContain("course.assignment");
		// 4. 評價與留言管理
		expect(html).toContain('href="/admin/course/review"');
		expect(html).toContain("course.review");
		// 5. 課程留言
		expect(html).toContain('href="/admin/course/comments"');
		expect(html).toContain("course.comments");
		// 6. 學員私訊
		expect(html).toContain('href="/admin/course/messages"');
		expect(html).toContain("course.messages");
		// 7. 課程優惠券
		expect(html).toContain('href="/admin/course/coupons"');
		expect(html).toContain("course.coupons");
		// 8. 課程綁定包
		expect(html).toContain('href="/admin/course/bundles"');
		expect(html).toContain("course.bundles");
		// 9. 新生問卷
		expect(html).toContain('href="/admin/course/onboarding-surveys"');
		expect(html).toContain("course.onboarding");
		// 10. 課程媒體庫
		expect(html).toContain('href="/admin/course/media"');
		expect(html).toContain("course.media");
		// 11. CoursePack 任務
		expect(html).toContain('href="/admin/course/course-pack"');
		expect(html).toContain("course.coursePack");
	});

	it("1.2e 在 /admin/settings/einvoice 時自動展開「系統設定」子選單且發票設定標記為 active", () => {
		mockIsCollapsed = false;
		mockCanAccessAdmin = true;
		mockPathname = "/admin/settings/einvoice";

		const html = renderToStaticMarkup(<NavBar />);

		// 系統設定父項目存在
		expect(html).toContain("admin.menu.systemSettings");

		// 子選單自動展開，全部 5 個設定子頁可見
		expect(html).toContain('href="/admin/email-settings"');
		expect(html).toContain("admin.menu.emailSettings");
		expect(html).toContain('href="/admin/settings/checkout-gateway"');
		expect(html).toContain("admin.menu.gateway");
		expect(html).toContain('href="/admin/settings/einvoice"');
		expect(html).toContain("admin.menu.einvoice");
		expect(html).toContain('href="/admin/settings/gemini"');
		expect(html).toContain("admin.menu.gemini");
		expect(html).toContain('href="/admin/settings/ai-provider"');
		expect(html).toContain("admin.menu.aiProvider");

		// 發票設定標記為 active
		const einvoiceLinkMatch = html.match(/<a[^>]*href="\/admin\/settings\/einvoice"[^>]*class="([^"]*)"/);
		expect(einvoiceLinkMatch).not.toBeNull();
		const einvoiceClasses = einvoiceLinkMatch?.[1] ?? "";
		expect(einvoiceClasses).toContain("font-semibold");
		expect(einvoiceClasses).toContain("text-foreground");
	});
});
