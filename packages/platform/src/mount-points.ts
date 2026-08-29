import type { PluginManifest } from "./types";

export const CORE_RESERVED_MOUNT_IDS = ["pages-cms"] as const;

export function assertPluginManifestAllowed(manifest: PluginManifest): void {
	if ((CORE_RESERVED_MOUNT_IDS as readonly string[]).includes(manifest.id)) {
		throw new Error(`RESERVED_MOUNT_ID:${manifest.id}`);
	}
}

export function registerPluginManifest(
	manifest: PluginManifest,
	registry: PluginManifest[] = MOUNT_POINTS,
): PluginManifest[] {
	assertPluginManifestAllowed(manifest);
	if (registry.some((entry) => entry.id === manifest.id)) {
		throw new Error(`DUPLICATE_MOUNT_ID:${manifest.id}`);
	}
	registry.push(manifest);
	return registry;
}

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
		id: "assignment",
		name: "課程作業",
		version: "0.1.0",
		mount: {
			route: { path: "/assignment-admin" },
			menu: { label: "作業管理", icon: "file-pen-line", order: 7, requiresOperator: true },
			content: { kind: "auto", boundTo: "/assignment" },
		},
		dataSpec: "content",
	},
	{
		id: "pages-cms",
		name: "頁面管理",
		version: "0.1.0",
		mount: {
			route: { path: "/admin/pages" },
			menu: { label: "頁面管理", icon: "file-text", order: 14, requiresOperator: true },
		},
		dataSpec: "none",
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
	{
		id: "onboarding-surveys",
		name: "新生問卷",
		version: "0.1.0",
		mount: {
			route: { path: "/admin/onboarding-surveys" },
			menu: { label: "新生問卷", icon: "clipboard-list", order: 16, requiresOperator: true },
		},
		dataSpec: "none",
	},
	{
		id: "media-library",
		name: "課程媒體庫",
		version: "0.1.0",
		mount: {
			route: { path: "/admin/media" },
			menu: { label: "媒體庫", icon: "image", order: 17, requiresOperator: true },
		},
		dataSpec: "none",
	},
	{
		id: "email-settings",
		name: "課程郵件",
		version: "0.1.0",
		mount: {
			route: { path: "/admin/email-settings" },
			menu: { label: "郵件設定", icon: "mail", order: 18, requiresOperator: true },
		},
		dataSpec: "none",
	},
];
