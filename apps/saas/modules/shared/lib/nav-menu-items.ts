import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";
import type { PluginManifest } from "@startkiter/platform/src/types";

export interface MountMenuItem {
	id: string;
	label: string;
	href: string;
	icon: string;
	order: number;
	isActive: boolean;
	requiresOperator?: boolean;
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

function isMenuActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function getMountMenuItems({
	pathname,
	isOperator,
}: {
	pathname: string;
	isOperator: boolean;
}): MountMenuItem[] {
	return MOUNT_POINTS.filter((plugin): plugin is PluginManifest & { mount: { menu: NonNullable<PluginManifest["mount"]["menu"]> } } => {
		if (!plugin.mount.menu) {
			return false;
		}
		if (plugin.mount.menu.requiresOperator && !isOperator) {
			return false;
		}
		return true;
	})
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
				isActive: isMenuActive(pathname, href),
				requiresOperator: menu.requiresOperator,
			};
		});
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
