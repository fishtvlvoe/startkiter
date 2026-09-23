import { describe, expect, it } from "vitest";
import { MOUNT_POINTS } from "@startkiter/platform";
import { getMountMenuItems, getTabBarItems, isMenuActive, type MountMenuItem } from "./nav-menu-items";

const labels: Record<string, string> = {
	"app.menu.start": "開始",
	"app.menu.support": "客服",
	"app.menu.aiAssistant": "AI 助手",
	"app.menu.accountSettings": "帳號設定",
	"course.navLabel": "課程",
	"course.quiz": "測驗管理",
	"course.assignment": "作業管理",
	"course.review": "評價與留言管理",
	"course.bundles": "課程綁定包",
	"course.onboarding": "新生問卷",
	"course.media": "媒體庫",
	"course.coursePack": "CoursePack 任務",
	"admin.menu.pages": "頁面管理",
	"admin.menu.users": "後台設定",
	"admin.menu.emailSettings": "郵件設定",
	"admin.menu.newsletter": "電子報",
	"admin.menu.organizations": "組織管理",
	"admin.menu.orders": "訂單管理",
	"admin.menu.revenue": "營收報表",
	"admin.menu.gateway": "收款閘道設定",
	"admin.menu.einvoice": "發票設定",
	"admin.menu.gemini": "Gemini API Key",
	"admin.menu.aiProvider": "AI 助手模型",
};

const labelForKey = (key: string): string => labels[key] ?? key;

function collectMenuHrefs(items: MountMenuItem[]): string[] {
	const hrefs: string[] = [];
	for (const item of items) {
		hrefs.push(item.href);
		for (const sub of item.subItems ?? []) {
			hrefs.push(sub.href);
		}
	}
	return hrefs;
}

describe("nav-menu-items (WorkspaceContext navigation model)", () => {
	it("app-user sees only user entries on /course", () => {
		const items = getMountMenuItems({ pathname: "/course", platformAdmin: false, labelForKey });

		expect(items.map((item) => item.label)).toEqual(["開始", "課程", "客服", "AI 助手", "帳號設定"]);
		expect(collectMenuHrefs(items).some((href) => href.startsWith("/admin/"))).toBe(false);
		expect(items.find((item) => item.href === "/course")?.isActive).toBe(true);
	});

	it("course app-admin sees one parent and ordered children without duplicates", () => {
		const items = getMountMenuItems({ pathname: "/admin/course", platformAdmin: false, labelForKey });
		const course = items.find((item) => item.id === "course-admin");
		const hrefs = collectMenuHrefs(items);

		expect(items).toHaveLength(1);
		expect(course?.label).toBe("課程");
		expect(course?.requiresOperator).toBe(true);
		expect(course?.subItems?.map((item) => item.label)).toEqual([
			"測驗管理",
			"作業管理",
			"評價與留言管理",
			"課程綁定包",
			"新生問卷",
			"媒體庫",
			"CoursePack 任務",
		]);
		expect(new Set(hrefs).size).toBe(hrefs.length);
	});

	it("platform scope shows platform entries and one entry per App", () => {
		const items = getMountMenuItems({
			pathname: "/admin/users",
			platformAdmin: true,
			canAccessPagesCms: true,
			labelForKey,
		});
		const hrefs = collectMenuHrefs(items);

		expect(items.map((item) => item.id)).toEqual([
			"admin",
			"course-admin",
			"pages-cms",
			"newsletter",
			"email-settings",
			"admin-organizations",
			"admin-orders",
			"admin-revenue",
			"admin-gateway-config",
			"admin-einvoice",
			"admin-gemini",
			"admin-ai-provider",
		]);
		expect(new Set(hrefs).size).toBe(hrefs.length);
		expect(items.find((item) => item.id === "course-admin")?.subItems).toBeUndefined();
	});

	it("filters pages-cms without changing App workspace", () => {
		const items = getMountMenuItems({
			pathname: "/admin/users",
			platformAdmin: true,
			canAccessPagesCms: false,
			labelForKey,
		});
		expect(items.some((item) => item.id === "pages-cms")).toBe(false);
		expect(items.some((item) => item.id === "course-admin")).toBe(true);
	});

	it("marks App child and platform routes active without false positives", () => {
		const mediaItems = getMountMenuItems({ pathname: "/admin/media", platformAdmin: false, labelForKey });
		const emailItems = getMountMenuItems({
			pathname: "/admin/email-settings",
				platformAdmin: true,
			canAccessPagesCms: true,
			labelForKey,
		});

		expect(mediaItems.find((item) => item.id === "course-admin")?.isActive).toBe(true);
		expect(mediaItems.find((item) => item.id === "course-admin")?.subItems?.find((item) => item.id === "media-library")?.href).toBe(
			"/admin/media",
		);
		expect(emailItems.filter((item) => item.isActive).map((item) => item.id)).toEqual(["email-settings"]);
	});

	it("uses the active locale for sidebar and overflow labels", () => {
		const englishLabels: Record<string, string> = {
			"app.menu.start": "Start",
			"course.navLabel": "Courses",
			"app.menu.support": "Support",
			"app.menu.aiAssistant": "AI assistant",
			"app.menu.accountSettings": "Account settings",
		};
		const englishItems = getMountMenuItems({
			pathname: "/course",
				platformAdmin: false,
			labelForKey: (key) => englishLabels[key] ?? key,
		});

		expect(englishItems.map((item) => item.label)).toEqual([
			"Start",
			"Courses",
			"Support",
			"AI assistant",
			"Account settings",
		]);
		expect(getTabBarItems(englishItems, "More").overflow[0]?.label).toBe("More");
	});

		it("isMenuActive prefers the longest matching admin href (/admin/course-pack vs /admin/course)", () => {
			const hrefs = ["/admin/course", "/admin/course-pack", "/admin/media", "/admin/email-settings"];
			expect(isMenuActive("/admin/course-pack", "/admin/course", hrefs)).toBe(false);
			expect(isMenuActive("/admin/course-pack", "/admin/course-pack", hrefs)).toBe(true);
			expect(isMenuActive("/admin/media", "/admin/media", hrefs)).toBe(true);
			expect(isMenuActive("/admin/email-settings", "/admin/email-settings", hrefs)).toBe(true);
		});

		it("includes the unified shell routes in the registry", () => {
			// Verify MOUNT_POINTS covers the authenticated routes that render inside AppWrapper
			const courseItem = MOUNT_POINTS.find((p) => p.id === "course");
			const bundlesItem = MOUNT_POINTS.find((p) => p.id === "bundles");

			expect(courseItem?.mount.route?.path).toBe("/course");
			expect(bundlesItem?.mount.route?.path).toBe("/admin/bundles");
		});
	});

	describe("Task 9.1 / 9.2 / 9.3: narrow viewport tab bar", () => {
		it("9.1 exposes fixed items when count <= 3 and creates overflow when count > 3", () => {
			const mockItems: MountMenuItem[] = [
				{ id: "start", label: "開始", href: "/app", icon: "home", order: 1, isActive: false },
				{ id: "course", label: "課程", href: "/course", icon: "book-open", order: 2, isActive: true },
				{ id: "support", label: "客服", href: "/support", icon: "bot-message-square", order: 3, isActive: false },
				{ id: "account", label: "帳號設定", href: "/settings/general", icon: "settings", order: 4, isActive: false },
			];

			const { fixed, overflow } = getTabBarItems(mockItems);

			expect(fixed).toHaveLength(3);
			expect(overflow).toHaveLength(1);
			expect(fixed[0]?.label).toBe("開始");
			expect(fixed[1]?.label).toBe("課程");
			expect(fixed[2]?.label).toBe("客服");
			expect(overflow[0]?.label).toBe("更多");
			expect(overflow[0]?.subItems).toEqual([
				{ label: "帳號設定", href: "/settings/general" },
			]);
		});

		it("9.2 More drawer contains overflow items and correctly marks active status", () => {
			const mockItems: MountMenuItem[] = [
				{ id: "1", label: "Item 1", href: "/1", icon: "home", order: 1, isActive: false },
				{ id: "2", label: "Item 2", href: "/2", icon: "home", order: 2, isActive: false },
				{ id: "3", label: "Item 3", href: "/3", icon: "home", order: 3, isActive: false },
				{ id: "admin", label: "管理設定", href: "/admin/bundles", icon: "settings", order: 4, isActive: true },
			];

			const { overflow } = getTabBarItems(mockItems);

			const more = overflow[0];
			expect(more).toBeDefined();
			expect(more?.isActive).toBe(true);
			expect(more?.subItems?.some((item) => item.href === "/admin/bundles")).toBe(true);
		});

		it("9.2 More drawer contains admin settings for operators only", () => {
			const operatorOverflow = getTabBarItems(
				getMountMenuItems({
					pathname: "/admin/users",
					platformAdmin: true,
					canAccessPagesCms: true,
					labelForKey,
				}),
			).overflow;
			const learnerOverflow = getTabBarItems(
				getMountMenuItems({ pathname: "/course", platformAdmin: false, labelForKey }),
			).overflow;

			expect(
				operatorOverflow[0]?.subItems?.some(
					(item) => item.href === "/admin/newsletter" || item.label === "電子報",
				),
			).toBe(true);
			expect(learnerOverflow.some((entry) => entry.subItems?.some((item) => item.href.startsWith("/admin/")))).toBe(
				false,
			);
		});

		it("9.3 tab bar helper puts everything in fixed and creates no overflow when there are 3 or fewer items", () => {
			const mockItems: MountMenuItem[] = [
				{ id: "start", label: "開始", href: "/", icon: "home", order: 0, isActive: true },
				{ id: "course", label: "課程", href: "/course", icon: "book-open", order: 1, isActive: false },
			];

			const { fixed, overflow } = getTabBarItems(mockItems);

			expect(fixed).toHaveLength(2);
			expect(overflow).toHaveLength(0);
		});
	});
