import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { invoicePreferenceSchema } from "@startkiter/payments";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { getPayUniSubscriptionGateway, resolveSubscriptionBaseUrl } from "../lib/subscription-gateway";

function generateGatewayTradeNo(): string {
	return `SUB${Date.now().toString(36).toUpperCase()}${randomBytes(6).toString("hex").toUpperCase()}`.slice(0, 25);
}

function isUniqueConstraintError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export const createSubscriptionCheckout = protectedProcedure
	.route({
		method: "POST",
		path: "/course/subscriptions/checkout",
		tags: ["Course"],
		summary: "Create a PAYUNi recurring billing checkout",
	})
	.input(z.object({ planId: z.string().min(1), invoicePreference: invoicePreferenceSchema.optional() }))
	.handler(async ({ input, context }) => {
		const plan = await db.courseSubscriptionPlan.findUnique({
			where: { id: input.planId },
			include: { course: { select: { id: true, title: true } } },
		});
		if (!plan || !plan.enabled) {
			throw new ORPCError("NOT_FOUND");
		}

		const existing = await db.courseSubscription.findFirst({
			where: {
				userId: context.user.id,
				courseId: plan.courseId,
				status: { in: ["PENDING", "ACTIVE"] },
			},
			select: { id: true },
		});
		if (existing) {
			throw new ORPCError("CONFLICT", { message: "此課程已有尚未結束的訂閱。" });
		}

		const gateway = await getPayUniSubscriptionGateway();
		if (!gateway) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "PAYUNi 尚未完成設定。" });
		}
		const baseUrl = resolveSubscriptionBaseUrl(context.url);
		if (!baseUrl) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "缺少有效的公開網站網址。" });
		}

		const gatewayTradeNo = generateGatewayTradeNo();
		let subscription;
		try {
			subscription = await db.courseSubscription.create({
				data: {
					userId: context.user.id,
					courseId: plan.courseId,
					planId: plan.id,
					status: "PENDING",
					gatewayTradeNo,
					interval: plan.interval,
					pricePerPeriod: plan.price,
					...(input.invoicePreference
						? {
								invoiceType: input.invoicePreference.invoiceType,
								invoiceCarrierType: input.invoicePreference.carrierType,
								invoiceCarrierId: input.invoicePreference.carrierId || null,
								invoiceTaxId: input.invoicePreference.taxId || null,
								invoiceTitle: input.invoicePreference.title || null,
								invoiceAddress: input.invoicePreference.address || null,
								invoiceLoveCode: input.invoicePreference.loveCode || null,
							}
						: {}),
				},
			});
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				throw new ORPCError("CONFLICT", { message: "此課程已有尚未結束的訂閱。" });
			}
			throw error;
		}

		try {
			const payment = await gateway.createSubscriptionSession({
				subscriptionId: subscription.id,
				gatewayTradeNo,
				pricePerPeriod: plan.price,
				interval: plan.interval,
				courseTitle: plan.course.title,
				baseUrl,
				payerEmail: context.user.email,
			});
			return { subscriptionId: subscription.id, planId: plan.id, payment };
		} catch (error) {
			await db.courseSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: error instanceof Error ? error.message : "PAYUNi 訂閱建立失敗。",
			});
		}
	});
