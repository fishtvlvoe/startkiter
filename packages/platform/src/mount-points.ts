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
			// TODO: NavBar 的 iconMap（apps/saas/modules/shared/components/NavBar.tsx）目前沒有
			// "package" 這個 key，未知圖示會 fallback 印出原始字串蓋到選單文字上（已回報給老闆看到的視覺 bug）。
			// iconMap 本身還是別人未 commit 的 WIP，先借用已存在且 MOUNT_POINTS 目前沒人用到的 "settings"
			// 頂著，等 iconMap 定案/補上專屬圖示再換回語意正確的值。
			menu: { label: "課程綁定包", icon: "settings", order: 15, requiresOperator: true },
		},
		dataSpec: "none",
	},
];

