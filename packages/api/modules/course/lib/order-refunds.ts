import { randomUUID } from "node:crypto";

import { db, type Prisma } from "@startkiter/database";
import { createMvpCheckoutGateway, loadCheckoutGatewayCredentials, type CheckoutGatewayType } from "@startkiter/payments";

const refundableStatuses = ["pending", "paid"] as const;
const ORDER_STATE_LOCK_PREFIX = "startkiter:order-state:";
const REFUND_OPERATION_LEASE_MS = 60_000;

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

function isStaleRefund(startedAt: Date | null): boolean {
	return !startedAt || Date.now() - startedAt.getTime() >= REFUND_OPERATION_LEASE_MS;
}

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
	return withOrderStateLock(orderId, (tx) => persistOrderRefund(tx, orderId));
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
	const reservation = await withOrderStateLock(orderId, async (tx) => {
		const order = await tx.order.findUnique({
			where: { id: orderId },
			select: {
				orderNo: true,
				status: true,
				paymentGateway: true,
				gatewayTradeNo: true,
				amount: true,
				currency: true,
				refundOperationToken: true,
				refundOperationStartedAt: true,
				refundStatus: true,
			},
		});
		if (!order) return null;
		if (order.status === "pending") return { kind: "pending" as const };
		if (order.status !== "paid") return { kind: "busy" as const };
		if (!["payuni", "shopline", "stripe"].includes(order.paymentGateway)) return { kind: "unsupported" as const };
		if (order.refundOperationToken && !isStaleRefund(order.refundOperationStartedAt)) return { kind: "busy" as const };
		const operationToken = randomUUID();
		const claimed = await tx.order.updateMany({
			where: {
				id: orderId,
				status: "paid",
				OR: [
					{ refundOperationToken: null },
					{ refundOperationStartedAt: null },
					{ refundOperationStartedAt: { lte: new Date(Date.now() - REFUND_OPERATION_LEASE_MS) } },
				],
			},
			data: { refundOperationToken: operationToken, refundOperationStartedAt: new Date(), refundStatus: "IN_PROGRESS", refundError: null },
		});
		if (claimed.count !== 1) return { kind: "busy" as const };
		return {
			kind: "gateway" as const,
			order: {
				orderNo: order.orderNo,
				paymentGateway: order.paymentGateway,
				gatewayTradeNo: order.gatewayTradeNo,
				amount: order.amount,
				currency: order.currency,
			},
			operationToken,
			recoverBeforeRefund: Boolean(order.refundOperationToken) || order.refundStatus === "NEEDS_REVIEW",
		};
	});
	if (!reservation || reservation.kind === "busy" || reservation.kind === "unsupported") return 0;
	if (reservation.kind === "pending") return withOrderStateLock(orderId, (tx) => persistOrderRefund(tx, orderId));
	const order = reservation.order;

	const finalize = async (result: { success: boolean; gatewayRefundId?: string; error?: string; ambiguous?: boolean; pending?: boolean }): Promise<number> => {
		return withOrderStateLock(orderId, async (tx) => {
			if (result.success) {
				const updated = await tx.order.updateMany({
					where: { id: orderId, status: "paid", refundOperationToken: reservation.operationToken },
					data: {
						status: "refunded",
						courseAccess: false,
						kitClaimEligible: false,
						refundedAt: new Date(),
						refundOperationToken: null,
						refundOperationStartedAt: null,
						refundGatewayRefundId: result.gatewayRefundId ?? null,
						refundError: null,
						refundStatus: "SUCCEEDED",
					},
				});
				return updated.count;
			}
			const needsReview = result.ambiguous === true || result.pending === true;
			const updated = await tx.order.updateMany({
				where: { id: orderId, status: "paid", refundOperationToken: reservation.operationToken },
				data: {
					refundOperationToken: null,
					refundOperationStartedAt: null,
					refundGatewayRefundId: result.gatewayRefundId ?? null,
					refundError: result.error ?? "退款失敗",
					refundStatus: needsReview ? "NEEDS_REVIEW" : "FAILED",
				},
			});
			return 0;
		});
	};

	const gatewayType = order.paymentGateway as CheckoutGatewayType;
	const configured = await loadCheckoutGatewayCredentials(gatewayType);
	if (!configured) {
		await finalize({ success: false, error: "退款金流尚未完成設定" });
		return 0;
	}
	const gateway = createMvpCheckoutGateway(configured.gateway, configured.credentials);
	if (!order.gatewayTradeNo) {
		await finalize({ success: false, error: "缺少金流交易編號，無法退款" });
		return 0;
	}
	if (reservation.recoverBeforeRefund) {
		if (!gateway.queryRefund) {
			await finalize({ success: false, ambiguous: true, error: "退款結果待查，金流不支援退款查詢" });
			return 0;
		}
		const queried = await gateway.queryRefund({ gatewayPaymentId: order.gatewayTradeNo, orderNo: order.orderNo, amount: order.amount, currency: order.currency });
		if (queried.status === "REFUNDED") return finalize({ success: true, gatewayRefundId: queried.gatewayRefundId });
		if (queried.status !== "NOT_REFUNDED") {
			await finalize({ success: false, ambiguous: true, error: queried.error ?? "退款結果待查" });
			return 0;
		}
	}
	// The durable token serializes callers. Shopline/Stripe use deterministic idempotency keys;
	// PAYUNi is queried before a stale retry, so a process crash cannot blindly duplicate a refund.
	const refund = await gateway.processRefund({ gatewayPaymentId: order.gatewayTradeNo, orderNo: order.orderNo, amount: order.amount, currency: order.currency });
	return refund.success ? finalize(refund) : (await finalize(refund), 0);
}
