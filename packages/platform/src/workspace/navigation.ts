export type WorkspaceRole = "app-user" | "app-admin";

export type WorkspaceContext =
	| { scope: "platform" }
	| { scope: "app"; appId: string; role: WorkspaceRole };

export type NavigationCapabilities = {
	userId: string;
	platformAdmin: boolean;
	appRoles: Record<string, WorkspaceRole | undefined>;
};

export type AppManifestEntry = {
	id: string;
	appId: string;
	scope: "platform" | "app";
	displayName?: string;
	displayNameKey: string;
	route: { path: string };
	menu?: {
		labelKey: string;
		icon: string;
		order: number;
		parentId?: string;
	};
	requiredRole: "platform-admin" | WorkspaceRole;
	i18nNamespace: string;
	children?: AppManifestEntry[];
};

export type NavigationItem = {
	id: string;
	href: string;
	labelKey: string;
	icon: string;
	order: number;
	children: Array<{ id: string; href: string; labelKey: string }>;
};

export type NavigationModel = {
	workspace: WorkspaceContext;
	workspaceLabel: string;
	items: NavigationItem[];
};

const SUPPORTED_ROLES = new Set<WorkspaceRole>(["app-user", "app-admin"]);
const LABEL_KEY_PATTERN = /^[a-z][a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9_-]+)+$/;
const FORBIDDEN_WORKSPACE_NOUNS = ["平台管理員", "模組管理員", "學員"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function flattenManifest(entries: AppManifestEntry[]): AppManifestEntry[] {
	return entries.flatMap((entry) => [entry, ...(entry.children ? flattenManifest(entry.children) : [])]);
}

function matchesRoute(pathname: string, routePath: string): boolean {
	return pathname === routePath || (routePath !== "/" && pathname.startsWith(`${routePath}/`));
}

function isRoleAllowed(requiredRole: AppManifestEntry["requiredRole"], role: WorkspaceRole): boolean {
	return role === "app-admin" ? requiredRole === "app-admin" : requiredRole === "app-user";
}

function getCatalogValue(catalog: unknown, path: string): unknown {
	return path.split(".").reduce<unknown>((current, segment) => {
		return isRecord(current) ? current[segment] : undefined;
	}, catalog);
}

function toNavigationItem(entry: AppManifestEntry, visibleEntries: AppManifestEntry[]): NavigationItem {
	const children = visibleEntries
		.filter((candidate) => candidate.menu?.parentId === entry.id && candidate.menu)
		.sort((left, right) => (left.menu?.order ?? 0) - (right.menu?.order ?? 0))
		.map((child) => ({
			id: child.id,
			href: child.route.path,
			labelKey: child.menu!.labelKey,
		}));

	return {
		id: entry.id,
		href: entry.route.path,
		labelKey: entry.menu!.labelKey,
		icon: entry.menu!.icon,
		order: entry.menu!.order,
		children,
	};
}

export function validateWorkspaceContext(context: unknown, apps: AppManifestEntry[] = []): asserts context is WorkspaceContext {
	if (!isRecord(context) || typeof context.scope !== "string") {
		throw new Error("INVALID_WORKSPACE_SCOPE:scope");
	}

	if (context.scope === "platform") {
		return;
	}

	if (context.scope !== "app") {
		throw new Error(`INVALID_WORKSPACE_SCOPE:${String(context.scope)}`);
	}

	if (typeof context.appId !== "string" || context.appId.trim() === "") {
		throw new Error("INVALID_WORKSPACE_APP_ID:appId");
	}

	if (typeof context.role !== "string" || !SUPPORTED_ROLES.has(context.role as WorkspaceRole)) {
		throw new Error(`INVALID_WORKSPACE_ROLE:${String(context.role)}`);
	}

	if (apps.length > 0 && !apps.some((entry) => entry.scope === "app" && entry.appId === context.appId)) {
		throw new Error(`UNKNOWN_APP_ID:${context.appId}`);
	}
}

export function validateNavigationRegistry(apps: AppManifestEntry[]): void {
	const entries = flattenManifest(apps);
	const ids = new Map<string, AppManifestEntry>();
	const hrefs = new Map<string, AppManifestEntry>();

	for (const entry of entries) {
		if (ids.has(entry.id)) {
			throw new Error(`DUPLICATE_MODULE_ID:${entry.id}`);
		}
		ids.set(entry.id, entry);

		if (hrefs.has(entry.route.path)) {
			throw new Error(`DUPLICATE_ROUTE:${entry.route.path}:${hrefs.get(entry.route.path)!.id}:${entry.id}`);
		}
		hrefs.set(entry.route.path, entry);

		if (entry.scope === "app" && entry.appId.trim() === "") {
			throw new Error(`INVALID_APP_ID:${entry.id}`);
		}
		if (entry.menu) {
			validateLabelKey(entry.menu.labelKey);
		}
	}

	for (const entry of entries) {
		const parentId = entry.menu?.parentId;
		if (!parentId) {
			continue;
		}
		const parent = ids.get(parentId);
		if (!parent) {
			throw new Error(`UNKNOWN_PARENT_ID:${parentId}:${entry.id}`);
		}
		if (parent.appId !== entry.appId || parent.scope !== entry.scope) {
			throw new Error(`INVALID_PARENT_SCOPE:${parentId}:${entry.id}`);
		}
	}
}

export function resolveNavigation(input: {
	pathname: string;
	capabilities: NavigationCapabilities;
	apps: AppManifestEntry[];
}): NavigationModel {
	validateNavigationRegistry(input.apps);

	const entries = flattenManifest(input.apps).filter((entry) => entry.menu);
	const currentEntry = [...entries]
		.sort((left, right) => right.route.path.length - left.route.path.length)
		.find((entry) => matchesRoute(input.pathname, entry.route.path));

	if (!currentEntry) {
		throw new Error(`UNKNOWN_NAVIGATION_ROUTE:${input.pathname}`);
	}

	let workspace: WorkspaceContext;
	if (currentEntry.scope === "platform") {
		if (!input.capabilities.platformAdmin) {
			throw new Error(`UNAUTHORIZED_PLATFORM_ROUTE:${input.pathname}`);
		}
		workspace = { scope: "platform" };
	} else {
		const role: WorkspaceRole = input.capabilities.platformAdmin
			? "app-admin"
			: (input.capabilities.appRoles[currentEntry.appId] ?? "app-user");
		workspace = { scope: "app", appId: currentEntry.appId, role };
	}
	validateWorkspaceContext(workspace, input.apps);

	const displayEntry = input.apps.find(
		(entry) => entry.scope === "app" && entry.appId === (workspace.scope === "app" ? workspace.appId : ""),
	);
	const workspaceLabel = getWorkspaceLabel(
		workspace,
		displayEntry?.displayName ?? (workspace.scope === "app" ? workspace.appId : "平台"),
	);

	if (workspace.scope === "platform") {
		const platformItems = entries
			.filter((entry) => entry.scope === "platform" && entry.requiredRole === "platform-admin" && !entry.menu?.parentId)
			.sort((left, right) => (left.menu!.order ?? 0) - (right.menu!.order ?? 0))
			.map((entry) => toNavigationItem(entry, entries));
		const appRoots = new Map<string, AppManifestEntry>();
		for (const entry of entries) {
			if (entry.scope !== "app" || entry.menu?.parentId) {
				continue;
			}
			const current = appRoots.get(entry.appId);
			if (!current || (entry.requiredRole === "app-admin" && current.requiredRole !== "app-admin")) {
				appRoots.set(entry.appId, entry);
			}
		}
		return {
			workspace,
			workspaceLabel,
			items: [...platformItems, ...[...appRoots.values()].map((entry) => toNavigationItem(entry, []))].sort(
				(left, right) => left.order - right.order,
			),
		};
	}

	const visibleEntries = entries.filter(
		(entry) =>
			entry.scope === "app" &&
			entry.appId === workspace.appId &&
			isRoleAllowed(entry.requiredRole, workspace.role),
	);
	const items = visibleEntries
		.filter((entry) => !entry.menu?.parentId)
		.sort((left, right) => (left.menu!.order ?? 0) - (right.menu!.order ?? 0))
		.map((entry) => toNavigationItem(entry, visibleEntries));

	return { workspace, workspaceLabel, items };
}

export function getWorkspaceLabel(workspace: WorkspaceContext, displayName: string): string {
	if (workspace.scope === "platform") {
		return "總管理員";
	}
	return workspace.role === "app-admin" ? `${displayName}管理員` : "使用者";
}

export function validateLabelKey(labelKey: string, knownKeys: string[] = []): void {
	if (!LABEL_KEY_PATTERN.test(labelKey)) {
		throw new Error(`INVALID_LABEL_KEY:labelKey=${labelKey}`);
	}
	if (knownKeys.length > 0 && !knownKeys.includes(labelKey)) {
		throw new Error(`UNKNOWN_LABEL_KEY:labelKey=${labelKey}`);
	}
}

export function assertNoForbiddenWorkspaceNouns(copy: string): void {
	const found = FORBIDDEN_WORKSPACE_NOUNS.filter((noun) => copy.includes(noun));
	if (found.length > 0) {
		throw new Error(`FORBIDDEN_WORKSPACE_NOUN:${found.join(",")}`);
	}
}

export function assertLocaleCatalogCompleteness(
	requiredKeys: string[],
	catalogs: Record<string, unknown>,
): void {
	const missing: string[] = [];
	for (const locale of ["zh-tw", "zh-cn", "en"]) {
		for (const key of requiredKeys) {
			const value = getCatalogValue(catalogs[locale], key);
			if (typeof value !== "string" || value.trim() === "") {
				missing.push(`${locale}:${key}`);
			}
		}
	}
	if (missing.length > 0) {
		throw new Error(`MISSING_LOCALE_KEYS:${missing.join(",")}`);
	}
}
