import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { getPayUniSubscriptionGateway } from "../lib/subscription-gateway";

export const cancelCourseSubscription = protectedProcedure
	.route({
		method: "POST",
		path: "/course/subscriptions/cancel",
		tags: ["Course"],
		summary: "Cancel a course subscription",
	})
	.input(z.object({ subscriptionId: z.string().min(1) }))
	.handler(async ({ input, context }) => {
		const subscription = await db.courseSubscription.findUnique({
			where: { id: input.subscriptionId },
			select: {
				id: true,
				userId: true,
				status: true,
				gatewaySubscriptionId: true,
			},
		});
		if (!subscription || subscription.userId !== context.user.id) {
			throw new ORPCError("NOT_FOUND");
		}
		if (subscription.status === "CANCELED") {
			throw new ORPCError("BAD_REQUEST", { message: "這筆訂閱已取消。" });
		}

		const gateway = await getPayUniSubscriptionGateway();
		if (!gateway) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "PAYUNi 尚未完成設定。" });
		}
		const result = await gateway.cancelSubscription({
			gatewaySubscriptionId: subscription.gatewaySubscriptionId ?? "",
		});
		if (!result.success) {
			throw new ORPCError("BAD_REQUEST", { message: result.error ?? "取消訂閱失敗。" });
		}

		const updated = await db.courseSubscription.update({
			where: { id: subscription.id },
			data: { status: "CANCELED", canceledAt: new Date() },
		});
		return { subscription: updated };
	});
