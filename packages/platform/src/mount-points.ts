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
