import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { getClientIp, recordAdminAction } from "@startkiter/platform";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";
import { handleRefundInvoice } from "../lib/invoice-events";
import { markOrderRefundedById } from "../lib/order-refunds";

export const refundOrder = adminProcedure
	.route({ method: "POST", path: "/course/orders/refund", tags: ["Course"], summary: "Refund an order" })
	.input(z.object({ orderId: z.string().min(1) }))
	.handler(async ({ input, context }) => {
		const count = await markOrderRefundedById(input.orderId);
		if (count === 0) {
			throw new ORPCError("BAD_REQUEST", { message: "這筆訂單不存在或已完成退款。" });
		}

		await handleRefundInvoice(input.orderId);
		const order = await db.order.findUnique({ where: { id: input.orderId } });
		if (!order) throw new ORPCError("NOT_FOUND");
		await recordAdminAction(
			context.user.id,
			"REFUND_ORDER",
			{ type: "Order", id: order.id },
			{ amount: order.amount },
			context.session?.ipAddress ?? getClientIp(context.headers),
		);
		return { order };
	});
