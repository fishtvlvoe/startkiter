import { db, type Prisma } from "@startkiter/database";
import { createMvpCheckoutGateway, loadCheckoutGatewayCredentials, type CheckoutGatewayType } from "@startkiter/payments";

const refundableStatuses = ["pending", "paid"] as const;
const ORDER_STATE_LOCK_PREFIX = "startkiter:order-state:";

type OrderRefundClient = Pick<Prisma.TransactionClient, "order">;

export async function acquireOrderStateLock(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
	await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${ORDER_STATE_LOCK_PREFIX}${orderId}`}, 0))`;
}

export async function withOrderStateLock<T>(orderId: string, callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
	return db.$transaction(
		async (tx) => {
			await acquireOrderStateLock(tx, orderId);
			return callback(tx);
		},
		{ maxWait: 10_000, timeout: 30_000 },
	);
}

export const withOrderRefundLock = withOrderStateLock;

async function persistOrderRefund(client: OrderRefundClient, orderId: string): Promise<number> {
	const result = await client.order.updateMany({
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

export async function markOrderRefundedById(orderId: string): Promise<number> {
	return persistOrderRefund(db, orderId);
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
	const order = await withOrderStateLock(orderId, async (tx) => {
		const order = await tx.order.findUnique({
			where: { id: orderId },
			select: { orderNo: true, status: true, paymentGateway: true, gatewayTradeNo: true, amount: true, currency: true },
		});
		return order;
	});
	if (!order || (order.status !== "pending" && order.status !== "paid")) return 0;
	if (order.status === "pending") return withOrderStateLock(orderId, (tx) => persistOrderRefund(tx, orderId));
	if (!["payuni", "shopline", "stripe"].includes(order.paymentGateway)) return 0;

	const gatewayType = order.paymentGateway as CheckoutGatewayType;
	const configured = await loadCheckoutGatewayCredentials(gatewayType);
	if (!configured) return 0;
	const gateway = createMvpCheckoutGateway(configured.gateway, configured.credentials);
	// Keep the provider call outside the DB transaction. Each gateway uses its own
	// idempotency/reconciliation key, so a retry can safely finish local revocation
	// if the short persistence transaction fails after the provider succeeds.
	const refund = await gateway.processRefund({ gatewayPaymentId: order.gatewayTradeNo, orderNo: order.orderNo, amount: order.amount, currency: order.currency });
	if (!refund.success) return 0;
	return withOrderStateLock(orderId, (tx) => persistOrderRefund(tx, orderId));
}
