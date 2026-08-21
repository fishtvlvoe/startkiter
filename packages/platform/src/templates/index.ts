import type { SiteTemplate } from "./types";

export type { SiteTemplate } from "./types";

export const SITE_TEMPLATES: SiteTemplate[] = [
	{
		id: "course-site",
		name: "課程教學站",
		description:
			"賣課與學員學習為主軸：首頁賣點、課程目錄、觀看頁與結帳動線一次到位。",
		previewImagePath: "/templates/course-site-preview.png",
		defaultMountConfig: [
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
				id: "start",
				name: "開始",
				version: "0.1.0",
				mount: {
					route: { path: "/app" },
					menu: { label: "開始", icon: "home", order: 0 },
				},
				dataSpec: "none",
			},
		],
		styleTokenOverrides: {
			"--primary": "var(--color-olive-950)",
			"--background": "var(--color-olive-50)",
		},
		aiPromptHint:
			"請依 packages/platform 的 course-site 模版，更新 MOUNT_POINTS 啟用課程選單，並把首頁改成賣課導流＋課程目錄。",
	},
	{
		id: "service-saas",
		name: "服務型 SaaS",
		description:
			"訂閱感儀表板與功能入口為主：強調帳號設定、客服與營運後台，適合服務型產品站。",
		previewImagePath: "/templates/service-saas-preview.png",
		defaultMountConfig: [
			{
				id: "start",
				name: "開始",
				version: "0.1.0",
				mount: {
					route: { path: "/app" },
					menu: { label: "儀表板", icon: "home", order: 0 },
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
		],
		styleTokenOverrides: {
			"--primary": "var(--color-olive-950)",
			"--background": "var(--color-olive-50)",
		},
		aiPromptHint:
			"請依 service-saas 模版調整側欄順序，儀表板置頂，凸顯客服與帳號設定，並套用 styleTokenOverrides。",
	},
	{
		id: "portfolio",
		name: "作品集展示",
		description:
			"作品／案例展示為主：輕量導覽、精選項目牆，適合個人品牌或工作室落地頁。",
		previewImagePath: "/templates/portfolio-preview.png",
		defaultMountConfig: [
			{
				id: "start",
				name: "開始",
				version: "0.1.0",
				mount: {
					route: { path: "/app" },
					menu: { label: "作品", icon: "home", order: 0 },
				},
				dataSpec: "none",
			},
		],
		styleTokenOverrides: {
			"--primary": "var(--color-olive-950)",
			"--background": "var(--color-olive-50)",
			"--foreground": "var(--color-olive-950)",
		},
		aiPromptHint:
			"請依 portfolio 模版把首頁改成作品牆，精簡側欄，只保留作品入口與必要設定。",
	},
];
