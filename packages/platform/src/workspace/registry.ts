import { MOUNT_POINTS } from "../mount-points";
import { APP_REGISTRY, type AppRegistrationManifest } from "../app-registration";
import type { PluginManifest } from "../types";
import type { AppManifestEntry } from "./navigation";

function getPluginContext(plugin: PluginManifest): NonNullable<PluginManifest["app"]> {
	if (plugin.app) {
		return plugin.app;
	}

	const scope = plugin.mount.menu?.requiresOperator ? "platform" : "app";
	return {
		appId: scope === "platform" ? "platform" : plugin.id,
		scope,
		displayName: plugin.name,
		displayNameKey: scope === "platform" ? "admin.navLabel" : `${plugin.id}.navLabel`,
		requiredRole: scope === "platform" ? "platform-admin" : "app-user",
	};
}

export function toAppManifestEntries(
	mountPoints: PluginManifest[] = MOUNT_POINTS,
	appRegistry: AppRegistrationManifest[] = APP_REGISTRY,
): AppManifestEntry[] {
	return mountPoints.flatMap((plugin) => {
		const menu = plugin.mount.menu;
		const route = plugin.mount.route;
		if (!menu || !route) {
			return [];
		}

		if (!menu.labelKey) {
			throw new Error(`MISSING_LABEL_KEY:${plugin.id}`);
		}

		const context = getPluginContext(plugin);
		const registeredApp = appRegistry.find((entry) => entry.appId === context.appId);
		const parentId =
			menu.parentId ??
			(context.scope === "app" && menu.groupId && menu.groupId !== plugin.id ? menu.groupId : undefined);

		return [
			{
				id: plugin.id,
				appId: context.appId,
				scope: context.scope,
				displayName: registeredApp?.displayName ?? context.displayName,
				displayNameKey: context.displayNameKey,
				route,
				menu: {
					labelKey: menu.labelKey,
					icon: menu.icon,
					order: menu.order,
					...(parentId ? { parentId } : {}),
				},
				requiredRole: context.requiredRole,
				i18nNamespace: context.displayNameKey.split(".")[0] ?? context.appId,
			},
		];
	});
}
