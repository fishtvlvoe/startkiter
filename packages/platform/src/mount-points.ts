import type { PluginManifest } from "./types";

export const MOUNT_POINTS: PluginManifest[] = [
	{
		id: "course",
		name: "課程模組",
		version: "0.1.0",
		mount: {
			route: { path: "/course" },
			menu: { label: "課程", icon: "📚", order: 1 },
			content: { kind: "auto", boundTo: "/course" },
		},
		dataSpec: "content",
	},
];
