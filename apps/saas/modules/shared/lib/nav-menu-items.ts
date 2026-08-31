// 只 import mount-points 子路徑，不要 import 整個 @startkiter/platform barrel——
// barrel 還 re-export packages/platform/src/deployment/db.ts（會拉進 Prisma/pg），
// 這個檔案被 "use client" 的 NavBar.tsx 引用，整包 barrel 進到 client bundle 會建置失敗
// （pg 需要 Node 的 util/types，瀏覽器打包解析不到）。
import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";
import type { PluginManifest } from "@startkiter/platform/src/types";

export interface MountMenuSubItem {
	id: string;
	label: string;
	href: string;
}

export interface MountMenuItem {
	id: string;
	label: string;
	href: string;
	icon: string;
	order: number;
	isActive: boolean;
	requiresOperator?: boolean;
	subItems?: MountMenuSubItem[];
}

export interface TabBarOverflowItem {
	label: string;
	href: string;
}

export interface TabBarItem {
	id: string;
	label: string;
	href: string;
	icon: string;
	isActive: boolean;
	subItems?: TabBarOverflowItem[];
}

/** Longest-prefix wins: only mark active when no other menu href is a more specific match. */
export function isMenuActive(pathname: string, href: string, allHrefs: string[] = []): boolean {
	if (href === "#") {
		return false;
	}

	const matchesPath =
		pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

	if (!matchesPath) {
		return false;
	}

	const hasMoreSpecificMatch = allHrefs.some(
		(otherHref) =>
			otherHref !== href &&
			otherHref.length > href.length &&
			(pathname === otherHref || pathname.startsWith(`${otherHref}/`)),
	);

	return !hasMoreSpecificMatch;
}

const MENU_GROUP_CONFIG: Record<
	string,
	{ id: string; label: string; icon: string; requiresOperator: boolean }
> = {
	"course-admin": {
		id: "course-admin-menu",
		label: "課程",
		icon: "book-open",
		requiresOperator: true,
	},
};

function groupMountMenuItems(flatItems: MountMenuItem[]): MountMenuItem[] {
	const topLevel: MountMenuItem[] = [];
	const groupedItems = new Map<string, MountMenuItem[]>();

	for (const item of flatItems) {
		const plugin = MOUNT_POINTS.find((entry) => entry.id === item.id);
		const groupId = plugin?.mount.menu?.groupId;

		if (groupId && MENU_GROUP_CONFIG[groupId]) {
			const bucket = groupedItems.get(groupId) ?? [];
			bucket.push(item);
			groupedItems.set(groupId, bucket);
			continue;
		}

		topLevel.push(item);
	}

	for (const [groupId, items] of groupedItems) {
		const config = MENU_GROUP_CONFIG[groupId];
		if (!config || items.length === 0) {
			continue;
		}

		const sorted = [...items].sort((a, b) => a.order - b.order);
		const subItems = sorted.map((entry) => ({
			id: entry.id,
			label: entry.label,
			href: entry.href,
		}));
		const parentActive = sorted.some((entry) => entry.isActive);

		topLevel.push({
			id: config.id,
			label: config.label,
			href: sorted[0]?.href ?? "#",
			icon: config.icon,
			order: sorted[0]?.order ?? 0,
			requiresOperator: config.requiresOperator,
			isActive: parentActive,
			subItems,
		});
	}

	return topLevel.sort((a, b) => a.order - b.order);
}

export function getMountMenuItems({
	pathname,
	isOperator,
	canAccessPagesCms = false,
}: {
	pathname: string;
	isOperator: boolean;
	canAccessPagesCms?: boolean;
}): MountMenuItem[] {
	const filtered = MOUNT_POINTS.filter((plugin): plugin is PluginManifest & { mount: { menu: NonNullable<PluginManifest["mount"]["menu"]> } } => {
		if (!plugin.mount.menu) {
			return false;
		}
		if (plugin.id === "pages-cms") {
			return canAccessPagesCms;
		}
		if (plugin.mount.menu.requiresOperator && !isOperator) {
			return false;
		}
		return true;
	});

	const allHrefs = filtered
		.map((plugin) => plugin.mount.route?.path)
		.filter((href): href is string => Boolean(href));

	const flatItems = filtered
		.sort((a, b) => a.mount.menu.order - b.mount.menu.order)
		.map((plugin) => {
			const menu = plugin.mount.menu;
			const href = plugin.mount.route?.path ?? "#";
			return {
				id: plugin.id,
				label: menu.label,
				href,
				icon: menu.icon,
				order: menu.order,
				isActive: isMenuActive(pathname, href, allHrefs),
				requiresOperator: menu.requiresOperator,
			};
		});

	return groupMountMenuItems(flatItems);
}

export function getTabBarItems(menuItems: MountMenuItem[]): {
	fixed: TabBarItem[];
	overflow: TabBarItem[];
} {
	const sorted = [...menuItems].sort((a, b) => a.order - b.order);
	const fixed = sorted.slice(0, 3).map((item) => ({
		id: item.id,
		label: item.label,
		href: item.href,
		icon: item.icon,
		isActive: item.isActive,
	}));

	const remaining = sorted.slice(3);
	const overflow: TabBarItem[] =
		remaining.length > 0
			? [
					{
						id: "more",
						label: "更多",
						href: "#",
						icon: "ellipsis",
						isActive: remaining.some((item) => item.isActive),
						subItems: remaining.map((item) => ({
							label: item.label,
							href: item.href,
						})),
					},
				]
			: [];

	return { fixed, overflow };
}
