export type PluginManifest = {
	id: string;
	name: string;
	version: string;
	mount: {
		route?: { path: string };
		menu?: {
			label: string;
			icon: string;
			order: number;
			requiresOperator?: boolean;
			/** Nest this item under a synthesized parent sidebar entry (see nav-menu-items.ts). */
			groupId?: string;
		};
		content?: { kind: "auto" | "shortcode" | "block"; boundTo?: string };
	};
	dataSpec: "content" | "none";
};
