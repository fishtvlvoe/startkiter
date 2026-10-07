import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	getCourseDashboardMetricsMock,
	getEmailSettingsSummaryMock,
	loadCheckoutGatewayCredentialsMock,
	getInvoiceSettingsMock,
	readAiProviderSettingsMock,
} = vi.hoisted(() => ({
	getCourseDashboardMetricsMock: vi.fn(),
	getEmailSettingsSummaryMock: vi.fn(),
	loadCheckoutGatewayCredentialsMock: vi.fn(),
	getInvoiceSettingsMock: vi.fn(),
	readAiProviderSettingsMock: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		order: {
			findMany: vi.fn(),
			count: vi.fn(),
			aggregate: vi.fn(),
		},
		lessonPrivateMessage: {
			count: vi.fn(),
		},
		lessonComment: {
			count: vi.fn(),
		},
		courseReview: {
			count: vi.fn(),
		},
		emailDeliveryLog: {
			count: vi.fn(),
		},
		course: {
			findMany: vi.fn(),
		},
		user: {
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("../../course/lib/course-dashboard", () => ({
	getCourseDashboardMetrics: getCourseDashboardMetricsMock,
}));

vi.mock("@startkiter/mail", () => ({
	getEmailSettingsSummary: getEmailSettingsSummaryMock,
}));

vi.mock("@startkiter/payments", () => ({
	loadCheckoutGatewayCredentials: loadCheckoutGatewayCredentialsMock,
}));

vi.mock("../../course/lib/invoice-settings", () => ({
	getInvoiceSettings: getInvoiceSettingsMock,
}));

vi.mock("@startkiter/ai", () => ({
	readAiProviderSettings: readAiProviderSettingsMock,
}));

vi.mock("../../ai/lib/provider-settings", () => ({
	readAiProviderSettings: readAiProviderSettingsMock,
}));

import { db } from "@startkiter/database";
import { getCourseDashboardMetrics } from "../../course/lib/course-dashboard";
import { getEmailSettingsSummary } from "@startkiter/mail";
import { loadCheckoutGatewayCredentials } from "@startkiter/payments";
import { getInvoiceSettings } from "../../course/lib/invoice-settings";
import { readAiProviderSettings } from "@startkiter/ai";

import { getPlatformDashboard } from "./platform-dashboard";

describe("platform dashboard aggregate (控制台資料彙整)", () => {
	const originalSupportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@startkiter.com";

		vi.mocked(getCourseDashboardMetrics).mockResolvedValue({
			publishedCourseCount: 1,
			studentCount: 2,
			revenueLast30Days: 10000,
		});

		vi.mocked(getEmailSettingsSummary).mockResolvedValue({
			activeProvider: "resend",
		} as never);

		vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue({
			gateway: "payuni",
			credentials: {
				merchantId: "test_merchant",
				hashKey: "test_hash_key_9999",
			},
		} as never);

		vi.mocked(getInvoiceSettings).mockResolvedValue({
			einvoiceEnabled: true,
			provider: "ecpay",
		} as never);

		vi.mocked(readAiProviderSettings).mockResolvedValue({
			provider: "openai",
			model: "gpt-4o-mini",
			hasGeminiKey: false,
		} as never);

		vi.mocked(db.order.findMany).mockResolvedValue([] as never);
		vi.mocked(db.lessonPrivateMessage.count).mockResolvedValue(0);
		vi.mocked(db.lessonComment.count).mockResolvedValue(0);
		vi.mocked(db.courseReview.count).mockResolvedValue(0);
		vi.mocked(db.emailDeliveryLog.count).mockResolvedValue(0);
		vi.mocked(db.course.findMany).mockResolvedValue([] as never);
	});

	afterEach(() => {
		if (originalSupportEmail === undefined) {
			delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
		} else {
			process.env.NEXT_PUBLIC_SUPPORT_EMAIL = originalSupportEmail;
		}
	});

	describe("1. Overview numbers (數字概況)", () => {
		it("依 30 天視窗範例表算出營收 8830 與付費訂單數 2", async () => {
			const fixedNow = new Date("2026-10-07T12:00:00.000Z");

			const sampleOrders = [
				{
					id: "ord-a",
					amount: 8800,
					status: "paid",
					paidAt: new Date("2026-10-06T10:00:00.000Z"),
					sku: "course-1",
					user: { email: "a@test.com" },
				},
				{
					id: "ord-b",
					amount: 30,
					status: "paid",
					paidAt: new Date("2026-09-08T10:00:00.000Z"),
					sku: "course-2",
					user: { email: "b@test.com" },
				},
				{
					id: "ord-c",
					amount: 500,
					status: "paid",
					paidAt: new Date("2026-09-06T10:00:00.000Z"),
					sku: "course-1",
					user: { email: "c@test.com" },
				},
				{
					id: "ord-d",
					amount: 900,
					status: "pending",
					paidAt: new Date("2026-10-05T10:00:00.000Z"),
					sku: "course-2",
					user: { email: "d@test.com" },
				},
			];

			vi.mocked(db.order.findMany).mockImplementation(async (args?: any) => {
				if (args?.take === 5) {
					return [sampleOrders[0], sampleOrders[1]] as never;
				}
				if (args?.where) {
					return sampleOrders.filter((order) => {
						if (args.where.status && order.status !== args.where.status) return false;
						if (args.where.paidAt?.gte && order.paidAt < args.where.paidAt.gte) return false;
						if (args.where.paidAt?.lte && order.paidAt > args.where.paidAt.lte) return false;
						return true;
					}) as never;
				}
				return sampleOrders as never;
			});

			vi.mocked(getCourseDashboardMetrics).mockResolvedValue({
				publishedCourseCount: 1,
				studentCount: 2,
				revenueLast30Days: 99999,
			});

			const result = await getPlatformDashboard("admin-user-1", fixedNow);

			expect(result.kpis).toEqual({
				status: "ok",
				data: {
					revenueLast30Days: 8830,
					paidOrdersLast30Days: 2,
					studentCount: 2,
					publishedCourseCount: 1,
				},
			});
			expect(getCourseDashboardMetrics).toHaveBeenCalledWith("admin-user-1");
		});

		it("當整站無訂單與課程時，數字概況皆為 0", async () => {
			const fixedNow = new Date("2026-10-07T12:00:00.000Z");
			vi.mocked(db.order.findMany).mockResolvedValue([] as never);
			vi.mocked(getCourseDashboardMetrics).mockResolvedValue({
				publishedCourseCount: 0,
				studentCount: 0,
				revenueLast30Days: 0,
			});

			const result = await getPlatformDashboard("admin-user-1", fixedNow);

			expect(result.kpis).toEqual({
				status: "ok",
				data: {
					revenueLast30Days: 0,
					paidOrdersLast30Days: 0,
					studentCount: 0,
					publishedCourseCount: 0,
				},
			});
		});
	});

	describe("2. Pending work counts (待處理項目)", () => {
		it("正確統計未讀私訊、未讀留言、未回覆評價、近 7 天寄送失敗信件", async () => {
			const fixedNow = new Date("2026-10-07T12:00:00.000Z");

			vi.mocked(db.lessonPrivateMessage.count).mockResolvedValue(3);
			vi.mocked(db.lessonComment.count).mockResolvedValue(5);
			vi.mocked(db.courseReview.count).mockResolvedValue(2);
			vi.mocked(db.emailDeliveryLog.count).mockResolvedValue(4);

			const result = await getPlatformDashboard("admin-user-1", fixedNow);

			expect(result.todos).toEqual({
				status: "ok",
				data: {
					unreadMessages: 3,
					unreadComments: 5,
					unrepliedReviews: 2,
					failedEmailsLast7Days: 4,
				},
			});

			expect(db.lessonPrivateMessage.count).toHaveBeenCalledWith({
				where: { readByTeacher: false },
			});
			expect(db.lessonComment.count).toHaveBeenCalledWith({
				where: { isRead: false, deletedAt: null },
			});
			expect(db.courseReview.count).toHaveBeenCalledWith({
				where: { replyContent: null, isVisible: true },
			});
			expect(db.emailDeliveryLog.count).toHaveBeenCalledWith({
				where: {
					status: "FAILED",
					createdAt: {
						gte: new Date(fixedNow.getTime() - 7 * 24 * 60 * 60 * 1000),
					},
				},
			});
		});

		it("已刪除的留言（deletedAt 不為 null）不計入未讀留言，只計入 deletedAt 為 null 且 isRead 為 false 的留言", async () => {
			const fixedNow = new Date("2026-10-07T12:00:00.000Z");

			vi.mocked(db.lessonComment.count).mockImplementation(async (args?: any) => {
				const where = args?.where;
				if (where?.deletedAt === null && where?.isRead === false) {
					return 1;
				}
				return 2;
			});

			const result = await getPlatformDashboard("admin-user-1", fixedNow);

			expect(db.lessonComment.count).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						isRead: false,
						deletedAt: null,
					}),
				}),
			);
			if (result.todos.status === "ok") {
				expect(result.todos.data.unreadComments).toBe(1);
			}
		});
	});

	describe("3. Configuration check (網站設定檢查)", () => {
		it("5 項設定皆齊全時，各項 ok 為 true 且連結正確", async () => {
			process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "help@startkiter.com";

			vi.mocked(getEmailSettingsSummary).mockResolvedValue({
				activeProvider: "resend",
			} as never);
			vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue({
				gateway: "payuni",
				credentials: { merchantId: "m1", hashKey: "k1" },
			} as never);
			vi.mocked(getInvoiceSettings).mockResolvedValue({
				einvoiceEnabled: true,
				provider: "ecpay",
			} as never);
			vi.mocked(readAiProviderSettings).mockResolvedValue({
				provider: "openai",
				model: "gpt-4o-mini",
				hasGeminiKey: false,
			} as never);

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.checks.status).toBe("ok");
			if (result.checks.status === "ok") {
				const items = result.checks.data;
				expect(items).toHaveLength(5);

				const emailCheck = items.find((item) => item.key === "email");
				expect(emailCheck).toBeDefined();
				expect(emailCheck?.ok).toBe(true);
				expect(emailCheck?.href).toBe("/admin/email-settings");

				const gatewayCheck = items.find((item) => item.key === "gateway");
				expect(gatewayCheck).toBeDefined();
				expect(gatewayCheck?.ok).toBe(true);
				expect(gatewayCheck?.href).toBe("/admin/settings/checkout-gateway");

				const einvoiceCheck = items.find((item) => item.key === "einvoice");
				expect(einvoiceCheck).toBeDefined();
				expect(einvoiceCheck?.ok).toBe(true);
				expect(einvoiceCheck?.href).toBe("/admin/settings/einvoice");

				const supportEmailCheck = items.find((item) => item.key === "supportEmail");
				expect(supportEmailCheck).toBeDefined();
				expect(supportEmailCheck?.ok).toBe(true);
				expect(supportEmailCheck?.href).toBe("/admin/email-settings");

				const aiCheck = items.find((item) => item.key === "ai");
				expect(aiCheck).toBeDefined();
				expect(aiCheck?.ok).toBe(true);
				expect(aiCheck?.href).toBe("/admin/settings/ai-provider");
			}
		});

		it("當各項未設定時，各項 ok 為 false", async () => {
			delete process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

			vi.mocked(getEmailSettingsSummary).mockResolvedValue({
				activeProvider: null,
			} as never);
			vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue(null);
			vi.mocked(getInvoiceSettings).mockResolvedValue({
				einvoiceEnabled: false,
			} as never);
			vi.mocked(readAiProviderSettings).mockResolvedValue({
				provider: "gemini",
				model: "gemini-1.5-pro",
				hasGeminiKey: false,
			} as never);

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.checks.status).toBe("ok");
			if (result.checks.status === "ok") {
				const items = result.checks.data;
				expect(items.every((item) => item.ok === false)).toBe(true);
			}
		});

		it("金流金鑰 test_hash_key_9999 絕對不出現在序列化結果中", async () => {
			vi.mocked(loadCheckoutGatewayCredentials).mockResolvedValue({
				gateway: "payuni",
				credentials: {
					merchantId: "real_merchant",
					hashKey: "test_hash_key_9999",
					hashIv: "test_hash_iv_8888",
				},
			} as never);

			const result = await getPlatformDashboard("admin-user-1");
			const serialized = JSON.stringify(result);

			expect(serialized).not.toContain("test_hash_key_9999");
			expect(serialized).not.toContain("test_hash_iv_8888");
			expect(serialized).not.toContain("real_merchant");
		});
	});

	describe("4. Recent orders (最近訂單)", () => {
		it("有 6 筆已付款訂單時，只取最新 5 筆且依照 paidAt 降序排列", async () => {
			const mockOrders = [
				{
					id: "ord-1",
					amount: 1000,
					status: "paid",
					paidAt: new Date("2026-10-06T10:00:00.000Z"),
					sku: "course-1",
					user: { email: "u1@test.com" },
					course: { title: "課程一" },
				},
				{
					id: "ord-2",
					amount: 2000,
					status: "paid",
					paidAt: new Date("2026-10-05T10:00:00.000Z"),
					sku: "course-2",
					user: { email: "u2@test.com" },
					course: { title: "課程二" },
				},
				{
					id: "ord-3",
					amount: 3000,
					status: "paid",
					paidAt: new Date("2026-10-04T10:00:00.000Z"),
					sku: "course-3",
					user: { email: "u3@test.com" },
					course: { title: "課程三" },
				},
				{
					id: "ord-4",
					amount: 4000,
					status: "paid",
					paidAt: new Date("2026-10-03T10:00:00.000Z"),
					sku: "course-4",
					user: { email: "u4@test.com" },
					course: { title: "課程四" },
				},
				{
					id: "ord-5",
					amount: 5000,
					status: "paid",
					paidAt: new Date("2026-10-02T10:00:00.000Z"),
					sku: "course-5",
					user: { email: "u5@test.com" },
					course: { title: "課程五" },
				},
				{
					id: "ord-6",
					amount: 6000,
					status: "paid",
					paidAt: new Date("2026-10-01T10:00:00.000Z"),
					sku: "course-6",
					user: { email: "u6@test.com" },
					course: { title: "課程六" },
				},
			];

			vi.mocked(db.order.findMany).mockImplementation(async (args?: any) => {
				if (args?.take === 5) {
					return mockOrders.slice(0, 5) as never;
				}
				return mockOrders as never;
			});

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.recentOrders.status).toBe("ok");
			if (result.recentOrders.status === "ok") {
				expect(result.recentOrders.data).toHaveLength(5);
				expect(result.recentOrders.data.map((order) => order.id)).toEqual([
					"ord-1",
					"ord-2",
					"ord-3",
					"ord-4",
					"ord-5",
				]);
				expect(result.recentOrders.data.map((order) => order.id)).not.toContain("ord-6");
			}
		});

		it("學員 email 遮罩兩例：alice@gmail.com -> a***@gmail.com，b@x.tw -> b***@x.tw", async () => {
			const mockOrders = [
				{
					id: "ord-alice",
					amount: 8800,
					status: "paid",
					paidAt: new Date("2026-10-06T10:00:00.000Z"),
					sku: "course-1",
					user: { email: "alice@gmail.com" },
					course: { title: "StartKiter 旗艦課程" },
				},
				{
					id: "ord-short",
					amount: 1200,
					status: "paid",
					paidAt: new Date("2026-10-05T10:00:00.000Z"),
					sku: "course-2",
					user: { email: "b@x.tw" },
					course: { title: "進階積木實戰" },
				},
			];

			vi.mocked(db.order.findMany).mockImplementation(async (args?: any) => {
				if (args?.take === 5) {
					return mockOrders as never;
				}
				return mockOrders as never;
			});

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.recentOrders.status).toBe("ok");
			if (result.recentOrders.status === "ok") {
				const aliceOrder = result.recentOrders.data.find((order) => order.id === "ord-alice");
				const shortOrder = result.recentOrders.data.find((order) => order.id === "ord-short");

				expect(aliceOrder?.maskedEmail).toBe("a***@gmail.com");
				expect(shortOrder?.maskedEmail).toBe("b***@x.tw");
			}
		});

		it("當沒有任何已付款訂單時，最近訂單回傳空陣列", async () => {
			vi.mocked(db.order.findMany).mockResolvedValue([] as never);

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.recentOrders).toEqual({
				status: "ok",
				data: [],
			});
		});
	});

	describe("5. Section failure isolation (區塊失敗隔離)", () => {
		it("當待處理查詢 throw 時，todos 狀態為 unavailable，其餘區塊仍為 ok 且整組不 throw", async () => {
			vi.mocked(db.lessonPrivateMessage.count).mockRejectedValue(
				new Error("Private message DB query failed"),
			);

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.todos).toEqual({ status: "unavailable" });
			expect(result.kpis.status).toBe("ok");
			expect(result.checks.status).toBe("ok");
			expect(result.recentOrders.status).toBe("ok");
		});

		it("當數字概況查詢 throw 時，kpis 狀態為 unavailable，其餘區塊仍為 ok", async () => {
			vi.mocked(getCourseDashboardMetrics).mockRejectedValue(
				new Error("Course dashboard metrics failed"),
			);

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.kpis).toEqual({ status: "unavailable" });
			expect(result.todos.status).toBe("ok");
			expect(result.checks.status).toBe("ok");
			expect(result.recentOrders.status).toBe("ok");
		});

		it("當設定檢查 throw 時，checks 狀態為 unavailable，其餘區塊仍為 ok", async () => {
			vi.mocked(loadCheckoutGatewayCredentials).mockRejectedValue(
				new Error("Gateway credential decryption failed"),
			);

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.checks).toEqual({ status: "unavailable" });
			expect(result.kpis.status).toBe("ok");
			expect(result.todos.status).toBe("ok");
			expect(result.recentOrders.status).toBe("ok");
		});

		it("當最近訂單查詢 throw 時，recentOrders 狀態為 unavailable，其餘區塊仍為 ok", async () => {
			vi.mocked(db.order.findMany).mockImplementation(async (args?: any) => {
				if (args?.take === 5) {
					throw new Error("Recent orders DB connection lost");
				}
				return [] as never;
			});

			const result = await getPlatformDashboard("admin-user-1");

			expect(result.recentOrders).toEqual({ status: "unavailable" });
			expect(result.kpis.status).toBe("ok");
			expect(result.todos.status).toBe("ok");
			expect(result.checks.status).toBe("ok");
		});
	});
});
