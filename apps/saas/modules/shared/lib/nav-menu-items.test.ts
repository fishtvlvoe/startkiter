import { describe, expect, it } from "vitest";
import { MOUNT_POINTS } from "@startkiter/platform";
import { getMountMenuItems, getTabBarItems, isMenuActive, type MountMenuItem } from "./nav-menu-items";

describe("nav-menu-items (Phase 2 shell mount points)", () => {
	describe("Task 5.1 / 5.2 / 5.3: sidebar items from MOUNT_POINTS", () => {
		it("renders all MOUNT_POINTS menu items sorted by order", () => {
			const learnerItems = getMountMenuItems({ pathname: "/course", isOperator: false });
			const operatorItems = getMountMenuItems({
				pathname: "/course",
				isOperator: true,
				canAccessPagesCms: true,
			});

			// Learner should see every non-operator-only menu item, sorted by order.
			expect(learnerItems.map((item) => item.label)).toEqual(["開始", "課程", "客服", "帳號設定"]);
			expect(learnerItems.find((item) => item.href === "/course")?.isActive).toBe(true);

			// Operator sees course admin children grouped under one「課程」parent.
			expect(operatorItems.map((item) => item.label)).toEqual([
				"開始",
				"課程",
				"客服",
				"帳號設定",
				"後台設定",
				"課程",
				"頁面管理",
				"郵件設定",
			]);
			const courseAdminMenu = operatorItems.find((item) => item.id === "course-admin-menu");
			expect(courseAdminMenu?.requiresOperator).toBe(true);
			expect(courseAdminMenu?.subItems?.map((item) => item.label)).toEqual([
				"課程管理",
				"測驗管理",
				"評價與留言管理",
				"作業管理",
				"課程綁定包",
				"新生問卷",
				"媒體庫",
				"CoursePack 任務",
			]);
			for (let i = 1; i < operatorItems.length; i++) {
				expect(operatorItems[i]!.order).toBeGreaterThanOrEqual(operatorItems[i - 1]!.order);
			}
		});

		it("marks 媒體庫 and 郵件設定 active on their routes without false positives", () => {
			const mediaItems = getMountMenuItems({
				pathname: "/admin/media",
				isOperator: true,
				canAccessPagesCms: true,
			});
			const emailItems = getMountMenuItems({
				pathname: "/admin/email-settings",
				isOperator: true,
				canAccessPagesCms: true,
			});

			const courseAdminOnMedia = mediaItems.find((item) => item.id === "course-admin-menu");
			expect(courseAdminOnMedia?.isActive).toBe(true);
			expect(courseAdminOnMedia?.subItems?.find((item) => item.id === "media-library")?.href).toBe(
				"/admin/media",
			);
			expect(mediaItems.filter((item) => item.isActive).map((item) => item.id)).toEqual([
				"course-admin-menu",
			]);

			const emailItem = emailItems.find((item) => item.id === "email-settings");
			expect(emailItem?.isActive).toBe(true);
			expect(emailItems.filter((item) => item.isActive).map((item) => item.id)).toEqual(["email-settings"]);
		});

		it("isMenuActive prefers the longest matching admin href (/admin/course-pack vs /admin/course)", () => {
			const hrefs = ["/admin/course", "/admin/course-pack", "/admin/media", "/admin/email-settings"];
			expect(isMenuActive("/admin/course-pack", "/admin/course", hrefs)).toBe(false);
			expect(isMenuActive("/admin/course-pack", "/admin/course-pack", hrefs)).toBe(true);
			expect(isMenuActive("/admin/media", "/admin/media", hrefs)).toBe(true);
			expect(isMenuActive("/admin/email-settings", "/admin/email-settings", hrefs)).toBe(true);
		});

		it("hides 頁面管理 from role=admin when canAccessPagesCms is false", () => {
			const items = getMountMenuItems({
				pathname: "/",
				isOperator: true,
				canAccessPagesCms: false,
			});
			expect(items.some((item) => item.id === "pages-cms")).toBe(false);
			const courseAdmin = items.find((item) => item.id === "course-admin-menu");
			expect(courseAdmin?.subItems?.some((item) => item.href === "/admin/bundles")).toBe(true);
		});

		it("shows 頁面管理 for ADMIN_EMAIL even when isOperator is false", () => {
			const items = getMountMenuItems({
				pathname: "/",
				isOperator: false,
				canAccessPagesCms: true,
			});
			expect(items.some((item) => item.id === "pages-cms")).toBe(true);
			expect(items.some((item) => item.href === "/admin/bundles")).toBe(false);
		});

		it("5.3 hides operator-only menu items from learners", () => {
			const learnerItems = getMountMenuItems({ pathname: "/", isOperator: false });
			const operatorItems = getMountMenuItems({
				pathname: "/",
				isOperator: true,
				canAccessPagesCms: true,
			});

			const learnerCourseAdmin = learnerItems.find((item) => item.id === "course-admin-menu");
			expect(learnerCourseAdmin).toBeUndefined();
			const operatorCourseAdmin = operatorItems.find((item) => item.id === "course-admin-menu");
			expect(operatorCourseAdmin?.subItems?.some((item) => item.href === "/admin/bundles")).toBe(true);
		});

		it("5.1 / 5.2 includes the unified Shell navigation on /course and /admin/bundles", () => {
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
				getMountMenuItems({ pathname: "/", isOperator: true, canAccessPagesCms: true }),
			).overflow;
			const learnerOverflow = getTabBarItems(getMountMenuItems({ pathname: "/", isOperator: false })).overflow;

			expect(
				operatorOverflow[0]?.subItems?.some(
					(item) => item.href === "/admin/bundles" || item.label === "課程",
				),
			).toBe(true);
			expect(learnerOverflow.some((entry) => entry.subItems?.some((item) => item.href === "/admin/bundles"))).toBe(
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
});
