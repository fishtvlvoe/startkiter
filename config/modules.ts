export interface ModuleNavigation {
	folder: string;
	order: number;
}

export interface ModuleMountPoints {
	database: string;
	api: string;
	ui: string;
	registry: string;
}

export interface ModuleDescriptor {
	id: string;
	title: string;
	description: string;
	icon: string;
	iconKey?: string;
	enabled: boolean;
	route: string;
	adminRoute?: string;
	folder?: string;
	order?: number;
	navigation: ModuleNavigation;
	mountPoints: ModuleMountPoints;
}

export const modules: ModuleDescriptor[] = [
	{
		id: "course",
		title: "電馭學院 (StartKiter Academy)",
		description: "互動式課程學習系統 · Fluent Player 統一影音 · 隨課 AI 助教",
		icon: "book-open",
		iconKey: "book-open",
		enabled: true,
		route: "/course",
		adminRoute: "/admin/course",
		folder: "核心學習",
		order: 1,
		navigation: {
			folder: "核心學習",
			order: 1,
		},
		mountPoints: {
			database: "packages/database/prisma/schema.prisma",
			api: "packages/api/modules/course/",
			ui: "apps/saas/app/(authenticated)/(main)/(account)/course/",
			registry: "config/modules.ts",
		},
	},
	{
		id: "deployment",
		title: "買家部署 (Coolify / Vercel)",
		description: "獨立伺服器與學員專屬部署管理",
		icon: "server",
		iconKey: "server",
		enabled: true,
		route: "/deployment",
		adminRoute: "/admin/deployments",
		folder: "部署與運維",
		order: 2,
		navigation: {
			folder: "部署與運維",
			order: 2,
		},
		mountPoints: {
			database: "packages/database/prisma/schema.prisma",
			api: "packages/api/modules/deployment/",
			ui: "apps/saas/app/(authenticated)/(main)/(account)/deployment/",
			registry: "config/modules.ts",
		},
	},
];
