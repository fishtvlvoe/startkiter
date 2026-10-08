import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const isOperatorMock = vi.hoisted(() => vi.fn());
const getPlatformDashboardMock = vi.hoisted(() => vi.fn());

vi.mock("@auth/lib/server", () => ({
	getSession: getSessionMock,
}));

vi.mock("@startkiter/permissions", () => ({
	isOperator: isOperatorMock,
}));

vi.mock("@startkiter/api/modules/admin/lib/platform-dashboard", () => ({
	getPlatformDashboard: getPlatformDashboardMock,
}));

vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
}));

vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: any) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import PlatformAdminDashboardPage from "./page";

describe("PlatformAdminDashboardPage (/admin/dashboard)", () => {
	const defaultDashboardData = {
		kpis: {
			status: "ok" as const,
			data: {
				revenueLast30Days: 8830,
				paidOrdersLast30Days: 3,
				studentCount: 2,
				publishedCourseCount: 1,
			},
		},
		todos: {
			status: "ok" as const,
			data: {
				unreadMessages: 2,
				unreadComments: 1,
				unrepliedReviews: 0,
				failedEmailsLast7Days: 0,
			},
		},
		checks: {
			status: "ok" as const,
			data: [
				{ key: "email" as const, ok: true, label: "ToSend 運作中", href: "/admin/email-settings" },
				{ key: "gateway" as const, ok: true, label: "PAYUNi 已設定", href: "/admin/settings/checkout-gateway" },
				{ key: "einvoice" as const, ok: false, label: "未啟用", href: "/admin/settings/einvoice" },
				{ key: "supportEmail" as const, ok: true, label: "fish@fishot.com", href: "/admin/email-settings" },
				{ key: "ai" as const, ok: false, label: "未填金鑰", href: "/admin/settings/ai-provider" },
			],
		},
		recentOrders: {
			status: "ok" as const,
			data: [
				{
					id: "order-1",
					paidAt: "2026-10-06T10:00:00.000Z",
					maskedEmail: "a***@gmail.com",
					courseTitle: "電馭學院",
					amount: 8800,
				},
				{
					id: "order-2",
					paidAt: "2026-10-02T10:00:00.000Z",
					maskedEmail: "b***@yahoo.com",
					courseTitle: "電馭學院",
					amount: 30,
				},
			],
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: { id: "admin-1", email: "admin@example.com", name: "Fish" },
		});
		isOperatorMock.mockReturnValue(true);
		getPlatformDashboardMock.mockResolvedValue(defaultDashboardData);
	});

	it("未登入者重導向至 /login", async () => {
		getSessionMock.mockResolvedValue(null);

		await expect(PlatformAdminDashboardPage()).rejects.toThrow("REDIRECT:/login");
	});

	it("非平台管理員重導向至 /", async () => {
		isOperatorMock.mockReturnValue(false);

		await expect(PlatformAdminDashboardPage()).rejects.toThrow("REDIRECT:/");
	});

	it("總管理員看到 5 區塊標題與內容", async () => {
		const page = await PlatformAdminDashboardPage();
		const html = renderToStaticMarkup(page);

		// 歡迎列
		expect(html).toContain("控制台");
		expect(html).toContain("早安，Fish");
		expect(html).not.toContain("網址：");

		// 5 區塊標題
		expect(html).toContain("近 30 天營收");
		expect(html).toContain("待處理");
		expect(html).toContain("網站設定檢查");
		expect(html).toContain("最近訂單");
		expect(html).toContain("快速操作");

		// 數字概況
		expect(html).toContain("NT$ 8,830");
		expect(html).toContain("3");
		expect(html).toContain("2");
		expect(html).toContain("1");

		// 待處理項目與連結
		expect(html).toContain("未讀學員私訊");
		expect(html).toContain("/admin/course/messages");
		expect(html).toContain("未讀課程留言");
		expect(html).toContain("/admin/course/comments");
		expect(html).toContain("未回覆評價");
		expect(html).toContain("/admin/course/review");
		expect(html).toContain("寄送失敗信件（近 7 天）");
		expect(html).toContain("/admin/email-settings");

		// 網站設定檢查
		expect(html).toContain("寄信服務");
		expect(html).toContain("ToSend 運作中");
		expect(html).toContain("PAYUNi 已設定");
		expect(html).toContain("未啟用");

		// 最近訂單
		expect(html).toContain("a***@gmail.com");
		expect(html).toContain("b***@yahoo.com");
		expect(html).toContain("電馭學院");

		// 快速操作依序是新增課程、新增單元、寫電子報、建立優惠券、查看前台，且帶有對應 action 參數
		const quickActionMatches = [
			...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
		].filter(([, , text]) =>
			["新增課程", "新增單元", "寫電子報", "建立優惠券", "查看前台"].some((label) =>
				text.includes(label),
			),
		);
		expect(
			quickActionMatches.map(([_, href, text]) => ({
				href,
				label: ["新增課程", "新增單元", "寫電子報", "建立優惠券", "查看前台"].find((l) =>
					text.includes(l),
				),
			})),
		).toEqual([
			{ href: "/admin/course?action=new-course", label: "新增課程" },
			{ href: "/admin/course?action=new-lesson", label: "新增單元" },
			{ href: "/admin/newsletter/new", label: "寫電子報" },
			{ href: "/admin/course/coupons", label: "建立優惠券" },
			{ href: "/", label: "查看前台" },
		]);

		// KPI 數字元素帶 whitespace-nowrap 與 text-xl
		expect(html).toMatch(
			/<p[^>]*class="[^"]*(?=.*whitespace-nowrap)(?=.*text-xl)[^"]*"[^>]*>\s*NT\$ 8,830\s*<\/p>/,
		);
	});

	it("某區塊 unavailable 時，該區塊顯示「暫時無法載入」，其他區塊仍正常渲染", async () => {
		getPlatformDashboardMock.mockResolvedValue({
			...defaultDashboardData,
			todos: { status: "unavailable" },
		});

		const page = await PlatformAdminDashboardPage();
		const html = renderToStaticMarkup(page);

		// 待處理區塊顯示暫時無法載入
		expect(html).toContain("待處理");
		expect(html).toContain("暫時無法載入");

		// 其餘區塊正常顯示
		expect(html).toContain("近 30 天營收");
		expect(html).toContain("NT$ 8,830");
		expect(html).toContain("網站設定檢查");
		expect(html).toContain("最近訂單");
		expect(html).toContain("快速操作");
	});
});
