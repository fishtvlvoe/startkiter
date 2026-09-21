import type { PluginManifest } from "./types";

const COURSE_USER_APP: NonNullable<PluginManifest["app"]> = {
	appId: "course",
	scope: "app",
	displayName: "課程",
	displayNameKey: "course.navLabel",
	requiredRole: "app-user",
};

const COURSE_ADMIN_APP: NonNullable<PluginManifest["app"]> = {
	appId: "course",
	scope: "app",
	displayName: "課程",
	displayNameKey: "course.navLabel",
	requiredRole: "app-admin",
};

const PLATFORM_APP: NonNullable<PluginManifest["app"]> = {
	appId: "platform",
	scope: "platform",
	displayName: "平台",
	displayNameKey: "admin.navLabel",
	requiredRole: "platform-admin",
};

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
		app: COURSE_USER_APP,
		mount: {
			route: { path: "/app" },
			menu: { labelKey: "app.menu.start", icon: "home", order: 0 },
		},
		dataSpec: "none",
	},
	{
		id: "course",
		name: "課程模組",
		version: "0.1.0",
		app: COURSE_USER_APP,
		mount: {
			route: { path: "/course" },
			menu: { labelKey: "course.navLabel", icon: "book-open", order: 1 },
			content: { kind: "auto", boundTo: "/course" },
		},
		dataSpec: "content",
	},
	{
		id: "course-admin",
		name: "課程管理後台",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/admin/course" },
			menu: {
				labelKey: "course.navLabel",
				icon: "book-open",
				order: 5,
				requiresOperator: true,
				groupId: "course-admin",
			},
		},
		dataSpec: "none",
	},
	{
		id: "quiz",
		name: "課後測驗",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/quiz-admin" },
			menu: {
				labelKey: "course.quiz",
				icon: "list-checks",
				order: 20,
				requiresOperator: true,
				groupId: "course-admin",
			},
			content: { kind: "auto", boundTo: "/quiz" },
		},
		dataSpec: "content",
	},
	{
		id: "assignment",
		name: "課程作業",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/assignment-admin" },
			menu: {
				labelKey: "course.assignment",
				icon: "file-pen-line",
				order: 30,
				requiresOperator: true,
				groupId: "course-admin",
			},
			content: { kind: "auto", boundTo: "/assignment" },
		},
		dataSpec: "content",
	},
	{
		id: "pages-cms",
		name: "頁面管理",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/pages" },
			menu: { labelKey: "admin.menu.pages", icon: "file-text", order: 14, requiresOperator: true },
		},
		dataSpec: "none",
	},
	{
		id: "review",
		name: "課程評價與留言",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/review-admin" },
			menu: {
				labelKey: "course.review",
				icon: "message-square",
				order: 40,
				requiresOperator: true,
				groupId: "course-admin",
			},
		},
		dataSpec: "none",
	},
	{
		id: "chatbot",
		name: "客服",
		version: "0.1.0",
		app: COURSE_USER_APP,
		mount: {
			route: { path: "/support" },
			menu: { labelKey: "app.menu.support", icon: "bot-message-square", order: 2 },
		},
		dataSpec: "none",
	},
	{
		id: "ai-assistant",
		name: "AI 助手",
		version: "0.1.0",
		app: COURSE_USER_APP,
		mount: {
			route: { path: "/ai" },
			menu: { labelKey: "app.menu.aiAssistant", icon: "sparkles", order: 2.5 },
		},
		dataSpec: "none",
	},
	{
		id: "settings",
		name: "帳號設定",
		version: "0.1.0",
		app: COURSE_USER_APP,
		mount: {
			route: { path: "/settings/general" },
			menu: { labelKey: "app.menu.accountSettings", icon: "settings", order: 3 },
		},
		dataSpec: "none",
	},
	{
		id: "admin",
		name: "後台設定",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/users" },
			menu: { labelKey: "admin.menu.users", icon: "shield-user", order: 4, requiresOperator: true },
		},
		dataSpec: "none",
	},
	{
		id: "bundles",
		name: "課程綁定包",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/admin/bundles" },
			menu: {
				labelKey: "course.bundles",
				icon: "package",
				order: 50,
				requiresOperator: true,
				groupId: "course-admin",
			},
		},
		dataSpec: "none",
	},
	{
		id: "onboarding-surveys",
		name: "新生問卷",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/admin/onboarding-surveys" },
			menu: {
				labelKey: "course.onboarding",
				icon: "clipboard-list",
				order: 60,
				requiresOperator: true,
				groupId: "course-admin",
			},
		},
		dataSpec: "none",
	},
	{
		id: "media-library",
		name: "課程媒體庫",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/admin/media" },
			menu: {
				labelKey: "course.media",
				icon: "image",
				order: 70,
				requiresOperator: true,
				groupId: "course-admin",
			},
		},
		dataSpec: "none",
	},
	{
		id: "course-pack-admin",
		name: "CoursePack 任務",
		version: "0.1.0",
		app: COURSE_ADMIN_APP,
		mount: {
			route: { path: "/admin/course-pack" },
			menu: {
				labelKey: "course.coursePack",
				icon: "clipboard-list",
				order: 80,
				requiresOperator: true,
				groupId: "course-admin",
			},
		},
		dataSpec: "none",
	},
	{
		id: "email-settings",
		name: "課程郵件",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/email-settings" },
			menu: { labelKey: "admin.menu.emailSettings", icon: "mail", order: 18, requiresOperator: true },
		},
		dataSpec: "none",
	},
	{
		id: "newsletter",
		name: "電子報",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/newsletter" },
			menu: { labelKey: "admin.menu.newsletter", icon: "mail", order: 17, requiresOperator: true },
		},
		dataSpec: "none",
	},
	{
		id: "admin-organizations",
		name: "組織管理",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/organizations" },
			menu: {
				labelKey: "admin.menu.organizations",
				icon: "user-cog",
				order: 19,
				requiresOperator: true,
			},
		},
		dataSpec: "none",
	},
	{
		id: "admin-orders",
		name: "訂單管理",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/orders" },
			menu: {
				labelKey: "admin.menu.orders",
				icon: "package",
				order: 20,
				requiresOperator: true,
			},
		},
		dataSpec: "none",
	},
	{
		id: "admin-revenue",
		name: "營收報表",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/revenue" },
			menu: {
				labelKey: "admin.menu.revenue",
				icon: "clipboard-list",
				order: 21,
				requiresOperator: true,
			},
		},
		dataSpec: "none",
	},
	{
		id: "admin-gateway-config",
		name: "收款閘道設定",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/settings/checkout-gateway" },
			menu: {
				labelKey: "admin.menu.gateway",
				icon: "settings",
				order: 22,
				requiresOperator: true,
				groupId: "admin-settings",
			},
		},
		dataSpec: "none",
	},
	{
		id: "admin-einvoice",
		name: "發票設定",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/settings/einvoice" },
			menu: {
				labelKey: "admin.menu.einvoice",
				icon: "file-text",
				order: 23,
				requiresOperator: true,
				groupId: "admin-settings",
			},
		},
		dataSpec: "none",
	},
	{
		id: "admin-gemini",
		name: "Gemini 設定",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/settings/gemini" },
			menu: {
				labelKey: "admin.menu.gemini",
				icon: "bot-message-square",
				order: 24,
				requiresOperator: true,
				groupId: "admin-settings",
			},
		},
		dataSpec: "none",
	},
	{
		id: "admin-ai-provider",
		name: "AI 助手模型設定",
		version: "0.1.0",
		app: PLATFORM_APP,
		mount: {
			route: { path: "/admin/settings/ai-provider" },
			menu: {
				labelKey: "admin.menu.aiProvider",
				icon: "bot-message-square",
				order: 25,
				requiresOperator: true,
				groupId: "admin-settings",
			},
		},
		dataSpec: "none",
	},
];
