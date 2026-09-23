export type PluginManifest = {
	id: string;
	name: string;
	version: string;
	app?: {
		appId: string;
		scope: "platform" | "app";
		displayName?: string;
		displayNameKey: string;
		requiredRole: "platform-admin" | "app-admin" | "app-user";
	};
	mount: {
		route?: { path: string };
		menu?: {
			/** Legacy template compatibility; runtime manifests must use labelKey. */
			label?: string;
			labelKey?: string;
			icon: string;
			order: number;
			requiresOperator?: boolean;
			/** Nest this item under a synthesized parent sidebar entry (see nav-menu-items.ts). */
			groupId?: string;
			parentId?: string;
		};
		content?: { kind: "auto" | "shortcode" | "block"; boundTo?: string };
	};
	dataSpec: "content" | "none";
};
