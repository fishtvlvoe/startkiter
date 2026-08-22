import { db } from "@startkiter/database";
import { checkPermission, type PermissionUser } from "@startkiter/permissions";
import { OrdersSpreadsheet, RevenueSpreadsheet, toHtmlString, toXlsxBuffer } from "@startkiter/sheets";
import { tool } from "ai";
import { z } from "zod";

const REPORT_TYPES = ["orders", "revenue"] as const;
type ReportType = (typeof REPORT_TYPES)[number];

export type GenerateSpreadsheetToolUser = PermissionUser;

export type GenerateSpreadsheetToolResult =
	| { error: string }
	| { format: "html"; html: string }
	| { format: "xlsx"; filename: string; contentType: string; data: string };

/**
 * 產生訂單銷售明細／課程營收結算的活公式報表工具，供對話式後台的 AI 代理人呼叫。
 * 資料一律從真實訂單紀錄查詢，不接受呼叫端直接餵入業務資料——避免任何登入使用者
 * 透過對話請 AI「假裝」查別人的訂單。權限檢查在 execute 內做，不是在路由層，
 * 因為這個工具會被註冊在一個所有登入使用者共用的聊天端點上（帳號設定頁的 AI 助理），
 * 不能只靠外層 protectedProcedure 擋，否則任何登入用戶都能透過聊天挖到全站營收資料。
 */
export function createGenerateSpreadsheetTool(user: GenerateSpreadsheetToolUser) {
	return tool({
		description:
			"產生訂單銷售明細或課程營收結算的活公式報表（Excel 公式，不是死數字）。" +
			"xlsx 格式回傳可下載的檔案；html 格式回傳可直接在對話裡預覽的表格。僅限管理員使用，資料為即時查詢的真實訂單。",
		inputSchema: z.object({
			report: z
				.enum(REPORT_TYPES)
				.describe("要產出的報表種類：orders（訂單銷售明細）或 revenue（課程營收結算）"),
			format: z
				.enum(["xlsx", "html"])
				.default("xlsx")
				.describe("xlsx 產生下載檔；html 產生可直接在對話中預覽的表格"),
		}),
		execute: async ({ report, format }): Promise<GenerateSpreadsheetToolResult> => {
			if (!checkPermission({ user }, "admin.access")) {
				return { error: "沒有權限產生這份報表，需要管理員權限。" };
			}

			const workbook = await buildWorkbook(report);
			return await finalizeWorkbook(workbook, format, report);
		},
	});
}

async function buildWorkbook(report: ReportType) {
	if (report === "orders") {
		const orders = await db.order.findMany({
			orderBy: { createdAt: "desc" },
			include: { user: { select: { name: true, email: true } } },
		});

		return OrdersSpreadsheet({
			orders: orders.map((order) => ({
				id: order.orderNo,
				customerName: order.user.name || order.user.email || undefined,
				itemName: order.sku,
				qty: 1,
				unitPrice: order.amount,
			})),
		});
	}

	const paidOrders = await db.order.findMany({
		where: { status: "paid" },
		orderBy: { createdAt: "desc" },
	});

	const grouped = new Map<string, { salesCount: number; price: number }>();
	for (const order of paidOrders) {
		const current = grouped.get(order.sku) ?? { salesCount: 0, price: order.amount };
		current.salesCount += 1;
		grouped.set(order.sku, current);
	}

	return RevenueSpreadsheet({
		courses: [...grouped].map(([courseId, value]) => ({ courseId, title: courseId, ...value })),
	});
}

async function finalizeWorkbook(
	workbook: unknown,
	format: "xlsx" | "html",
	report: ReportType,
): Promise<GenerateSpreadsheetToolResult> {
	if (format === "html") {
		return { format: "html", html: toHtmlString(workbook) };
	}

	const buffer = await toXlsxBuffer(workbook);
	return {
		format: "xlsx",
		filename: `${report}.xlsx`,
		contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		data: buffer.toString("base64"),
	};
}
