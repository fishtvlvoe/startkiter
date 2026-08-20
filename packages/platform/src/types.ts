export type PluginManifest = {
	id: string;
	name: string;
	version: string;
	mount: {
		route?: { path: string };
		menu?: { label: string; icon: string; order: number; requiresOperator?: boolean };
		content?: { kind: "auto" | "shortcode" | "block"; boundTo?: string };
	};
	dataSpec: "content" | "none";
};
