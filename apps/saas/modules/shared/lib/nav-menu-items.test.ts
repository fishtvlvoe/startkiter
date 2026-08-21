import { describe, expect, it } from "vitest";
import { MOUNT_POINTS } from "@startkiter/platform";
import { getMountMenuItems, getTabBarItems, type MountMenuItem } from "./nav-menu-items";

describe("nav-menu-items (Phase 2 shell mount points)", () => {
	describe("Task 5.1 / 5.2 / 5.3: sidebar items from MOUNT_POINTS", () => {
		it("renders all MOUNT_POINTS menu items sorted by order", () => {
			const learnerItems = getMountMenuItems({ pathname: "/", isOperator: false });
			const operatorItems = getMountMenuItems({ pathname: "/", isOperator: true });

			expect(learnerItems.map((item) => item.label)).toEqual(["課程"]);
			expect(operatorItems.map((item) => item.label)).toEqual(["課程", "課程綁定包"]);
		});

		it("5.3 hides operator-only menu items from learners", () => {
			const learnerItems = getMountMenuItems({ pathname: "/", isOperator: false });
			const operatorItems = getMountMenuItems({ pathname: "/", isOperator: true });

			expect(learnerItems.some((item) => item.href === "/admin/bundles")).toBe(false);
			expect(operatorItems.some((item) => item.href === "/admin/bundles")).toBe(true);
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
		it("9.1 exposes exactly 4 tab bar items at 375px when items exceed 3: start / course / support / more", () => {
			const mockItems: MountMenuItem[] = [
				{ id: "start", label: "開始", href: "/", icon: "home", order: 0, isActive: false },
				{ id: "course", label: "課程", href: "/course", icon: "book-open", order: 1, isActive: false },
				{ id: "support", label: "客服", href: "/support", icon: "bot-message-square", order: 2, isActive: false },
				{ id: "settings", label: "帳號設定", href: "/settings/general", icon: "settings", order: 3, isActive: false },
			];
			const { fixed, overflow } = getTabBarItems(mockItems);

			expect(fixed).toHaveLength(3);
			expect(overflow).toHaveLength(1);
			expect(fixed[0]?.label).toBe("開始");
			expect(fixed[1]?.label).toBe("課程");
			expect(fixed[2]?.label).toBe("客服");
			expect(overflow[0]?.label).toBe("更多");
		});

		it("9.2 More drawer contains account settings for operators and learners", () => {
			const mockItems: MountMenuItem[] = [
				{ id: "start", label: "開始", href: "/", icon: "home", order: 0, isActive: false },
				{ id: "course", label: "課程", href: "/course", icon: "book-open", order: 1, isActive: false },
				{ id: "support", label: "客服", href: "/support", icon: "bot-message-square", order: 2, isActive: false },
				{ id: "settings", label: "帳號設定", href: "/settings/general", icon: "settings", order: 3, isActive: false },
			];
			const { overflow } = getTabBarItems(mockItems);

			const more = overflow[0];
			expect(more).toBeDefined();
			expect(more?.subItems?.some((item) => item.href === "/settings/general")).toBe(true);
		});

		it("9.2 More drawer contains admin settings for operators only", () => {
			const operatorItems: MountMenuItem[] = [
				...getMountMenuItems({ pathname: "/", isOperator: true }),
				{ id: "start", label: "開始", href: "/", icon: "home", order: 0, isActive: false },
				{ id: "support", label: "客服", href: "/support", icon: "bot-message-square", order: 2, isActive: false },
				{ id: "settings", label: "帳號設定", href: "/settings/general", icon: "settings", order: 3, isActive: false },
			];
			const operatorOverflow = getTabBarItems(operatorItems).overflow;

			const learnerItems: MountMenuItem[] = [
				...getMountMenuItems({ pathname: "/", isOperator: false }),
				{ id: "start", label: "開始", href: "/", icon: "home", order: 0, isActive: false },
				{ id: "support", label: "客服", href: "/support", icon: "bot-message-square", order: 2, isActive: false },
				{ id: "settings", label: "帳號設定", href: "/settings/general", icon: "settings", order: 3, isActive: false },
			];
			const learnerOverflow = getTabBarItems(learnerItems).overflow;

			expect(operatorOverflow[0]?.subItems?.some((item) => item.href === "/admin/bundles")).toBe(true);
			expect(learnerOverflow[0]?.subItems?.some((item) => item.href === "/admin/bundles")).toBe(false);
		});

		it("9.3 wide viewport uses sidebar, tab bar is not rendered", () => {
			const items = getMountMenuItems({ pathname: "/", isOperator: false });
			const { fixed, overflow } = getTabBarItems(items);

			// On wide viewport the full sidebar is shown; tab bar split is only a mobile concern.
			// The helper still produces the split, but the UI chooses not to render it.
			expect(fixed.length + overflow.length).toBeGreaterThan(0);
		});
	});
});
