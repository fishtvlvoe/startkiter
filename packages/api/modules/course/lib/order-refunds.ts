import { db } from "@startkiter/database";
import { createMvpCheckoutGateway, loadCheckoutGatewayCredentials, type CheckoutGatewayType } from "@startkiter/payments";

const refundableStatuses = ["pending", "paid"] as const;

export async function markOrderRefundedById(orderId: string): Promise<number> {
	const result = await db.order.updateMany({
		where: { id: orderId, status: { in: [...refundableStatuses] } },
		data: {
			status: "refunded",
			courseAccess: false,
			kitClaimEligible: false,
			refundedAt: new Date(),
		},
	});
	return result.count;
}

export async function markOrderRefundedByOrderNo(orderNo: string): Promise<number> {
	const result = await db.order.updateMany({
		where: { orderNo, status: { in: [...refundableStatuses] } },
		data: {
			status: "refunded",
			courseAccess: false,
			kitClaimEligible: false,
			refundedAt: new Date(),
		},
	});
	return result.count;
}

/** Refund the external transaction first, then revoke local access. */
export async function refundOrderThroughGateway(orderId: string): Promise<number> {
	const order = await db.order.findUnique({
		where: { id: orderId },
		select: { orderNo: true, status: true, paymentGateway: true, gatewayTradeNo: true, amount: true, currency: true },
	});
	if (!order || (order.status !== "pending" && order.status !== "paid") || !["payuni", "shopline", "stripe"].includes(order.paymentGateway)) return 0;

	const gatewayType = order.paymentGateway as CheckoutGatewayType;
	const configured = await loadCheckoutGatewayCredentials(gatewayType);
	if (!configured) return 0;
	const gateway = createMvpCheckoutGateway(configured.gateway, configured.credentials);
	const refund = await gateway.processRefund({ gatewayPaymentId: order.gatewayTradeNo, orderNo: order.orderNo, amount: order.amount, currency: order.currency });
	if (!refund.success) return 0;
	return markOrderRefundedById(orderId);
}
