import { MOUNT_POINTS } from "./mount-points";

export const SUPPORTED_LOCALES = ["zh-tw", "zh-cn", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type AppRegistrationManifest = {
	appId: string;
	displayName: string;
	route: { basePath: string };
	menu: {
		labelKey: string;
		icon: { light: string; dark: string };
	};
	eligibility: {
		userRole: "app-user" | "app-admin";
		grantedBy: "self-serve" | "invite-only" | "operator-assigned";
	};
	i18nNamespace: string;
	supportedLocales: SupportedLocale[];
	tests: {
		unit: string[];
		browser: string[];
	};
};

export type AppRegistrationResult = {
	registered: boolean;
	missing: string[];
	conflicts: string[];
	errors: string[];
};

export type AppRegistryValidationFailure = {
	index: number;
	missing: string[];
	conflicts: string[];
};

export type AppRegistryValidationResult = {
	valid: boolean;
	failures: AppRegistryValidationFailure[];
};

export type DisplayNameActor = {
	appId: string;
	role: "app-user" | "app-admin";
};

export type DisplayNameUpdateRequest = {
	appId: string;
	displayName: string;
	actor: DisplayNameActor;
};

export type DisplayNameUpdateResult = {
	updated: boolean;
	errors: string[];
};

const RESERVED_DISPLAY_NAMES = new Set(["總管理員", "使用者"]);
const APP_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function nonBlankString(value: unknown): value is string {
	return typeof value === "string" && value.trim() !== "";
}

function hasStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.length > 0 && value.every((item) => nonBlankString(item));
}

function addMissing(missing: string[], field: string, value: unknown): void {
	if (!nonBlankString(value)) {
		missing.push(field);
	}
}

function validateManifestShape(value: unknown): { manifest?: AppRegistrationManifest; missing: string[] } {
	const missing: string[] = [];
	if (!isRecord(value)) {
		return { missing: ["manifest"] };
	}

	addMissing(missing, "appId", value.appId);
	if (nonBlankString(value.appId) && !APP_ID_PATTERN.test(value.appId.trim())) {
		missing.push("appId");
	}

	addMissing(missing, "displayName", value.displayName);
	if (nonBlankString(value.displayName)) {
		const displayName = value.displayName.trim();
		if (Array.from(displayName).length > 20 || RESERVED_DISPLAY_NAMES.has(displayName)) {
			missing.push("displayName");
		}
	}

	const route = isRecord(value.route) ? value.route : undefined;
	addMissing(missing, "route.basePath", route?.basePath);

	const menu = isRecord(value.menu) ? value.menu : undefined;
	addMissing(missing, "menu.labelKey", menu?.labelKey);
	const icon = menu && isRecord(menu.icon) ? menu.icon : undefined;
	addMissing(missing, "menu.icon.light", icon?.light);
	addMissing(missing, "menu.icon.dark", icon?.dark);

	const eligibility = isRecord(value.eligibility) ? value.eligibility : undefined;
	if (eligibility?.userRole !== "app-user" && eligibility?.userRole !== "app-admin") {
		missing.push("eligibility.userRole");
	}
	if (
		eligibility?.grantedBy !== "self-serve" &&
		eligibility?.grantedBy !== "invite-only" &&
		eligibility?.grantedBy !== "operator-assigned"
	) {
		missing.push("eligibility.grantedBy");
	}

	addMissing(missing, "i18nNamespace", value.i18nNamespace);
	const supportedLocales = Array.isArray(value.supportedLocales) ? value.supportedLocales : [];
	for (const locale of SUPPORTED_LOCALES) {
		if (!supportedLocales.includes(locale)) {
			missing.push(`supportedLocales.${locale}`);
		}
	}

	const tests = isRecord(value.tests) ? value.tests : undefined;
	if (!hasStringArray(tests?.unit)) {
		missing.push("tests.unit");
	}
	if (!hasStringArray(tests?.browser)) {
		missing.push("tests.browser");
	}

	if (missing.length > 0) {
		return { missing: [...new Set(missing)] };
	}

	return { manifest: value as unknown as AppRegistrationManifest, missing: [] };
}

const courseMountPoint = MOUNT_POINTS.find((entry) => entry.id === "course");
if (!courseMountPoint?.mount.route || !courseMountPoint.mount.menu?.labelKey) {
	throw new Error("MISSING_COURSE_APP_MOUNT_POINT");
}

export const COURSE_APP_REGISTRATION_MANIFEST: AppRegistrationManifest = {
	appId: courseMountPoint.app?.appId ?? "course",
	displayName: courseMountPoint.app?.displayName ?? courseMountPoint.name,
	route: { basePath: courseMountPoint.mount.route.path },
	menu: {
		labelKey: courseMountPoint.mount.menu.labelKey,
		icon: { light: courseMountPoint.mount.menu.icon, dark: courseMountPoint.mount.menu.icon },
	},
	eligibility: { userRole: "app-user", grantedBy: "self-serve" },
	i18nNamespace: "course",
	supportedLocales: [...SUPPORTED_LOCALES],
	tests: {
		unit: ["packages/platform/src/workspace/registry.test.ts"],
		browser: ["tests/course.browser.ts"],
	},
};

export const APP_REGISTRY: AppRegistrationManifest[] = [COURSE_APP_REGISTRATION_MANIFEST];

export function registerApp(
	value: unknown,
	registry: AppRegistrationManifest[] = APP_REGISTRY,
): AppRegistrationResult {
	const { manifest, missing } = validateManifestShape(value);
	if (!manifest) {
		return { registered: false, missing, conflicts: [], errors: [...missing] };
	}

	const conflicts: string[] = [];
	const existingApp = registry.find((entry) => entry.appId === manifest.appId);
	if (existingApp) {
		conflicts.push(`appId:${existingApp.appId}`);
	}
	const existingRoute = registry.find((entry) => entry.route.basePath === manifest.route.basePath);
	if (existingRoute) {
		conflicts.push(`route.basePath:${existingRoute.appId}`);
	}

	if (conflicts.length > 0) {
		return { registered: false, missing: [], conflicts, errors: [...conflicts] };
	}

	registry.push(manifest);
	return { registered: true, missing: [], conflicts: [], errors: [] };
}

export function validateAppRegistry(entries: readonly unknown[]): AppRegistryValidationResult {
	const validatedRegistry: AppRegistrationManifest[] = [];
	const failures: AppRegistryValidationFailure[] = [];

	entries.forEach((entry, index) => {
		const result = registerApp(entry, validatedRegistry);
		if (!result.registered) {
			failures.push({ index, missing: result.missing, conflicts: result.conflicts });
		}
	});

	return { valid: failures.length === 0, failures };
}

function validateDisplayName(displayName: string): string[] {
	const normalized = displayName.trim();
	if (normalized === "" || Array.from(normalized).length > 20 || RESERVED_DISPLAY_NAMES.has(normalized)) {
		return ["displayName"];
	}
	return [];
}

export function updateAppDisplayName(
	registry: AppRegistrationManifest[],
	request: DisplayNameUpdateRequest,
): DisplayNameUpdateResult {
	const app = registry.find((entry) => entry.appId === request.appId);
	if (!app) {
		return { updated: false, errors: [`UNKNOWN_APP_ID:${request.appId}`] };
	}
	if (request.actor.appId !== request.appId || request.actor.role !== "app-admin") {
		return { updated: false, errors: ["UNAUTHORIZED_APP_ADMIN"] };
	}

	const errors = validateDisplayName(request.displayName);
	if (errors.length > 0) {
		return { updated: false, errors };
	}

	app.displayName = request.displayName.trim();
	return { updated: true, errors: [] };
}

export const updateDisplayName = updateAppDisplayName;
