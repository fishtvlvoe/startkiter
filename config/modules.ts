export interface ModuleDescriptor {
	id: string;
	title: string;
	description: string;
	enabled: boolean;
	route: string;
	adminRoute?: string;
	mountPoints: {
		database: string;
		api: string;
		ui: string;
		registry: string;
	};
}

export const modules: ModuleDescriptor[] = [
	{
		id: "course",
		title: "電馭學院 (StartKiter Academy)",
		description: "互動式課程學習系統 · Fluent Player 統一影音 · 隨課 AI 助教",
		enabled: true,
		route: "/course",
		adminRoute: "/admin/course",
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
		enabled: true,
		route: "/deployment",
		adminRoute: "/admin/deployments",
		mountPoints: {
			database: "packages/database/prisma/schema.prisma",
			api: "packages/api/modules/deployment/",
			ui: "apps/saas/app/(authenticated)/(main)/(account)/deployment/",
			registry: "config/modules.ts",
		},
	},
];
