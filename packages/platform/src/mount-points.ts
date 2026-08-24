import type { PluginManifest } from "./types";

export const MOUNT_POINTS: PluginManifest[] = [
	{
		id: "start",
		name: "開始",
		version: "0.1.0",
		mount: {
			route: { path: "/app" },
			menu: { label: "開始", icon: "home", order: 0 },
		},
		dataSpec: "none",
	},
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
		id: "quiz",
		name: "課後測驗",
		version: "0.1.0",
		mount: {
			route: { path: "/quiz-admin" },
			menu: { label: "測驗管理", icon: "list-checks", order: 5, requiresOperator: true },
			content: { kind: "auto", boundTo: "/quiz" },
		},
		dataSpec: "content",
	},
	{
		id: "review",
		name: "課程評價與留言",
		version: "0.1.0",
		mount: {
			route: { path: "/review-admin" },
			menu: { label: "評價與留言管理", icon: "message-square", order: 6, requiresOperator: true },
		},
		dataSpec: "none",
	},
	{
		id: "chatbot",
		name: "客服",
		version: "0.1.0",
		mount: {
			route: { path: "/chatbot" },
			menu: { label: "客服", icon: "bot-message-square", order: 2 },
		},
		dataSpec: "none",
	},
	{
		id: "settings",
		name: "帳號設定",
		version: "0.1.0",
		mount: {
			route: { path: "/settings/general" },
			menu: { label: "帳號設定", icon: "settings", order: 3 },
		},
		dataSpec: "none",
	},
	{
		id: "admin",
		name: "後台設定",
		version: "0.1.0",
		mount: {
			route: { path: "/admin/users" },
			menu: { label: "後台設定", icon: "shield-user", order: 4, requiresOperator: true },
		},
		dataSpec: "none",
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
