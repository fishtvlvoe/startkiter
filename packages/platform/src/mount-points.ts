import type { PluginManifest } from "./types";

export const MOUNT_POINTS: PluginManifest[] = [
	{
		id: "course",
		name: "課程模組",
		version: "0.1.0",
		mount: {
			route: { path: "/course" },
			menu: { label: "課程", icon: "book-open", order: 1 },
			content: { kind: "auto", boundTo: "/course" },
		},
		dataSpec: "content",
	},
	{
		id: "bundles",
		name: "課程綁定包",
		version: "0.1.0",
		mount: {
			route: { path: "/admin/bundles" },
			menu: { label: "課程綁定包", icon: "package", order: 15, requiresOperator: true },
		},
		dataSpec: "none",
	},
];
