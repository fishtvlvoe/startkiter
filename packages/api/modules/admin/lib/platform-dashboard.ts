import { readAiProviderSettings } from "@startkiter/ai";
import { db } from "@startkiter/database";
import { getEmailSettingsSummary } from "@startkiter/mail";
import { loadCheckoutGatewayCredentials } from "@startkiter/payments";

import { getCourseDashboardMetrics } from "../../course/lib/course-dashboard";
import { getInvoiceSettings } from "../../course/lib/invoice-settings";

export type Section<T> = { status: "ok"; data: T } | { status: "unavailable" };

export type PlatformDashboardCheckItem = {
	key: "email" | "gateway" | "einvoice" | "supportEmail" | "ai";
	ok: boolean;
	label: string;
	href: string;
};

export type PlatformDashboard = {
	kpis: Section<{
		revenueLast30Days: number;
		paidOrdersLast30Days: number;
		studentCount: number;
		publishedCourseCount: number;
	}>;
	todos: Section<{
		unreadMessages: number;
		unreadComments: number;
		unrepliedReviews: number;
		failedEmailsLast7Days: number;
	}>;
	checks: Section<PlatformDashboardCheckItem[]>;
	recentOrders: Section<
		Array<{
			id: string;
			paidAt: string;
			maskedEmail: string;
			courseTitle: string;
			amount: number;
		}>
	>;
};

export function maskEmail(email: string): string {
	const atIndex = email.indexOf("@");
	if (atIndex <= 0) {
		return email;
	}
	const local = email.slice(0, atIndex);
	const domain = email.slice(atIndex);
	return `${local[0]}***${domain}`;
}

export async function getPlatformDashboard(
	userId: string,
	now?: Date,
): Promise<PlatformDashboard> {
	const currentTime = now ?? new Date();
	const thirtyDaysAgo = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);
	const sevenDaysAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);

	const [kpisResult, todosResult, checksResult, recentOrdersResult] =
		await Promise.allSettled([
			// 1. KPIs
			(async () => {
				const [courseMetrics, orders30Days] = await Promise.all([
					getCourseDashboardMetrics(userId),
					db.order.findMany({
						where: {
							status: "paid",
							paidAt: {
								gte: thirtyDaysAgo,
								lte: currentTime,
							},
						},
						select: {
							amount: true,
						},
					}),
				]);

				const revenueLast30Days = orders30Days.reduce(
					(total, order) => total + (order.amount || 0),
					0,
				);
				const paidOrdersLast30Days = orders30Days.length;

				return {
					revenueLast30Days,
					paidOrdersLast30Days,
					studentCount: courseMetrics.studentCount,
					publishedCourseCount: courseMetrics.publishedCourseCount,
				};
			})(),

			// 2. Todos
			(async () => {
				const [unreadMessages, unreadComments, unrepliedReviews, failedEmailsLast7Days] =
					await Promise.all([
						db.lessonPrivateMessage.count({
							where: { readByTeacher: false },
						}),
						db.lessonComment.count({
							where: { isRead: false, deletedAt: null },
						}),
						db.courseReview.count({
							where: { replyContent: null, isVisible: true },
						}),
						db.emailDeliveryLog.count({
							where: {
								status: "FAILED",
								createdAt: {
									gte: sevenDaysAgo,
								},
							},
						}),
					]);

				return {
					unreadMessages,
					unreadComments,
					unrepliedReviews,
					failedEmailsLast7Days,
				};
			})(),

			// 3. Checks
			(async () => {
				const [emailSummary, gatewayCreds, invoiceSettings, aiSettings] =
					await Promise.all([
						getEmailSettingsSummary(),
						loadCheckoutGatewayCredentials(),
						getInvoiceSettings(),
						readAiProviderSettings(),
					]);

				const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

				const emailOk = Boolean(emailSummary?.activeProvider);
				const gatewayOk = gatewayCreds !== null;
				const einvoiceOk = Boolean(invoiceSettings?.einvoiceEnabled);
				const supportEmailOk = Boolean(supportEmail && supportEmail.length > 0);
				const aiOk = aiSettings
					? aiSettings.provider === "openai"
						? Boolean(process.env.OPENAI_API_KEY?.trim())
						: Boolean(aiSettings.hasGeminiKey)
					: false;

				const gatewayName = gatewayCreds?.gateway === "payuni"
					? "PAYUNi"
					: (gatewayCreds?.gateway ? String(gatewayCreds.gateway).toUpperCase() : "金流");

				const checks: PlatformDashboardCheckItem[] = [
					{
						key: "email",
						ok: emailOk,
						label: emailOk ? `${emailSummary!.activeProvider} 運作中` : "未設定",
						href: "/admin/email-settings",
					},
					{
						key: "gateway",
						ok: gatewayOk,
						label: gatewayOk ? `${gatewayName} 已設定` : "未設定",
						href: "/admin/settings/checkout-gateway",
					},
					{
						key: "einvoice",
						ok: einvoiceOk,
						label: einvoiceOk ? "已啟用" : "未啟用",
						href: "/admin/settings/einvoice",
					},
					{
						key: "supportEmail",
						ok: supportEmailOk,
						label: supportEmailOk ? supportEmail! : "未設定",
						href: "/admin/email-settings",
					},
					{
						key: "ai",
						ok: aiOk,
						label: aiOk ? "已設定" : "未填金鑰",
						href: "/admin/settings/ai-provider",
					},
				];

				return checks;
			})(),

			// 4. Recent orders
			(async () => {
				const orders = await db.order.findMany({
					where: { status: "paid" },
					orderBy: { paidAt: "desc" },
					take: 5,
					include: {
						user: {
							select: { email: true },
						},
					},
				});

				const skus = Array.from(new Set(orders.map((o) => o.sku)));
				const courses = skus.length > 0
					? await db.course.findMany({
							where: {
								OR: [
									{ slug: { in: skus } },
									{ id: { in: skus } },
								],
							},
							select: { id: true, slug: true, title: true },
						}).catch(() => [])
					: [];

				const skuTitleMap = new Map<string, string>();
				for (const course of courses) {
					skuTitleMap.set(course.slug, course.title);
					skuTitleMap.set(course.id, course.title);
				}

				return orders.map((order) => {
					const email = order.user?.email ?? "";
					const masked = maskEmail(email);
					const courseTitle =
						(order as any).course?.title ??
						skuTitleMap.get(order.sku) ??
						order.sku;

					return {
						id: order.id,
						paidAt: order.paidAt
							? (order.paidAt instanceof Date ? order.paidAt.toISOString() : String(order.paidAt))
							: "",
						maskedEmail: masked,
						courseTitle,
						amount: order.amount,
					};
				});
			})(),
		]);

	return {
		kpis:
			kpisResult.status === "fulfilled"
				? { status: "ok", data: kpisResult.value }
				: { status: "unavailable" },
		todos:
			todosResult.status === "fulfilled"
				? { status: "ok", data: todosResult.value }
				: { status: "unavailable" },
		checks:
			checksResult.status === "fulfilled"
				? { status: "ok", data: checksResult.value }
				: { status: "unavailable" },
		recentOrders:
			recentOrdersResult.status === "fulfilled"
				? { status: "ok", data: recentOrdersResult.value }
				: { status: "unavailable" },
	};
}
