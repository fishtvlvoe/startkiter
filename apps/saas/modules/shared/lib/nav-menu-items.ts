// 只 import mount-points 子路徑，不要 import 整個 @startkiter/platform barrel——
// barrel 還 re-export packages/platform/src/deployment/db.ts（會拉進 Prisma/pg），
// 這個檔案被 "use client" 的 NavBar.tsx 引用，整包 barrel 進到 client bundle 會建置失敗
// （pg 需要 Node 的 util/types，瀏覽器打包解析不到）。
import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";
import {
	resolveNavigation,
	type NavigationCapabilities,
	type WorkspaceRole,
} from "@startkiter/platform/src/workspace/navigation";
import { toAppManifestEntries } from "@startkiter/platform/src/workspace/registry";

export interface MountMenuSubItem {
	id: string;
	label: string;
	labelKey?: string;
	href: string;
}

export interface MountMenuItem {
	id: string;
	label: string;
	labelKey?: string;
	href: string;
	icon: string;
	order: number;
	isActive: boolean;
	requiresOperator?: boolean;
	subItems?: MountMenuSubItem[];
}

export interface MountMenuNavigationInput {
	pathname: string;
	platformAdmin: boolean;
	canAccessPagesCms?: boolean;
	labelForKey?: (key: string) => string;
	workspaceRole?: WorkspaceRole;
}

export type MountNavigationContext = {
	apps: ReturnType<typeof toAppManifestEntries>;
	resolutionPath: string;
	capabilities: NavigationCapabilities;
	isPagesCmsOnly: boolean;
};

export type MountNavigationResolution = ReturnType<typeof resolveMountNavigation>;

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

function matchesRoute(pathname: string, routePath: string): boolean {
	return pathname === routePath || (routePath !== "/" && pathname.startsWith(`${routePath}/`));
}

function getAppRoleForPath(
	pathname: string,
	apps: ReturnType<typeof toAppManifestEntries>,
): { appId: string; role: WorkspaceRole } | undefined {
	const current = [...apps]
		.sort((left, right) => right.route.path.length - left.route.path.length)
		.find((entry) => matchesRoute(pathname, entry.route.path));

	if (!current || current.scope !== "app") {
		return undefined;
	}

	return {
		appId: current.appId,
		role: current.requiredRole === "app-admin" ? "app-admin" : "app-user",
	};
}

export function getMountNavigationContext({
	pathname,
	platformAdmin,
	canAccessPagesCms = false,
	workspaceRole,
}: MountMenuNavigationInput): MountNavigationContext {
	const apps = toAppManifestEntries(MOUNT_POINTS).filter(
		(entry) => canAccessPagesCms || entry.id !== "pages-cms",
	);
	const requestedPath = pathname === "/" ? "/app" : pathname;
	const requestedEntry = [...apps]
		.sort((left, right) => right.route.path.length - left.route.path.length)
		.find((entry) => matchesRoute(requestedPath, entry.route.path));
	const resolutionPath = requestedEntry
		? requestedPath
		: platformAdmin && requestedPath.startsWith("/admin/")
			? "/admin/users"
			: "/app";
	const appRole = getAppRoleForPath(resolutionPath, apps);
	const currentEntry = [...apps]
		.sort((left, right) => right.route.path.length - left.route.path.length)
		.find((entry) => matchesRoute(resolutionPath, entry.route.path));
	const isPagesCmsOnly = currentEntry?.id === "pages-cms" && canAccessPagesCms && !platformAdmin;
	return {
		apps,
		resolutionPath,
		capabilities: {
			userId: "navigation",
			platformAdmin: platformAdmin || isPagesCmsOnly,
			appRoles: appRole
				? { [appRole.appId]: workspaceRole ?? appRole.role }
				: {},
		},
		isPagesCmsOnly,
	};
}

export function resolveMountNavigation(input: MountMenuNavigationInput) {
	const context = getMountNavigationContext(input);
	return {
		...context,
		model: resolveNavigation({
			pathname: context.resolutionPath,
			capabilities: context.capabilities,
			apps: context.apps,
		}),
	};
}

export function getMountMenuItems({
	labelForKey = (key: string) => key,
	resolvedNavigation,
	...input
}: MountMenuNavigationInput & {
	resolvedNavigation?: MountNavigationResolution;
}): MountMenuItem[] {
	const { apps, model, isPagesCmsOnly } = resolvedNavigation ?? resolveMountNavigation(input);

	const entriesById = new Map(apps.map((entry) => [entry.id, entry]));
	const allHrefs = model.items.flatMap((item) => [item.href, ...item.children.map((child) => child.href)]);

	return model.items.filter((item) => !isPagesCmsOnly || item.id === "pages-cms").map((item) => {
		const children = item.children.map((child) => ({
			id: child.id,
			label: labelForKey(child.labelKey),
			labelKey: child.labelKey,
			href: child.href,
		}));
		const isActive =
			isMenuActive(input.pathname, item.href, allHrefs) ||
			children.some((child) => isMenuActive(input.pathname, child.href, allHrefs));
		const entry = entriesById.get(item.id);

		return {
			id: item.id,
			label: labelForKey(item.labelKey),
			labelKey: item.labelKey,
			href: item.href,
			icon: item.icon,
			order: item.order,
			isActive,
			requiresOperator:
				model.workspace.scope === "platform"
					? entry?.scope === "platform"
					: entry?.requiredRole === "app-admin",
			subItems: children.length > 0 ? children : undefined,
		};
	});
}

export function getTabBarItems(menuItems: MountMenuItem[], moreLabel = "更多"): {
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
					label: moreLabel,
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
