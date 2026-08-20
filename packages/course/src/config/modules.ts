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

export const courseModuleDescriptor: ModuleDescriptor = {
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
};
