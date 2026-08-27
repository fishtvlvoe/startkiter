import { randomUUID } from "node:crypto";

import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { withInvoiceOperationLock } from "../lib/invoice-settings";
import { getPayUniSubscriptionGateway } from "../lib/subscription-gateway";
import { handleRefundInvoiceForSubscription } from "../lib/invoice-events";

const CANCELLATION_LEASE_MS = 60_000;

function isStaleCancellation(startedAt: Date | null): boolean {
	return !startedAt || Date.now() - startedAt.getTime() >= CANCELLATION_LEASE_MS;
}

async function finalizeLocalCancellation(subscriptionId: string, operationToken: string) {
	return withInvoiceOperationLock(async (tx) => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`startkiter:subscription-state:${subscriptionId}`}, 0))`;
		const changed = await tx.courseSubscription.updateMany({
			where: { id: subscriptionId, status: "ACTIVE", cancellationOperationToken: operationToken },
			data: { status: "CANCELED", canceledAt: new Date(), cancellationOperationToken: null, cancellationOperationStartedAt: null, cancellationError: null },
		});
		if (changed.count !== 1) throw new ORPCError("CONFLICT", { message: "取消結果無法安全寫回，請查核 PAYUNi 狀態。" });
		return tx.courseSubscription.findUnique({ where: { id: subscriptionId } });
	});
}

export const cancelCourseSubscription = protectedProcedure
	.route({
		method: "POST",
		path: "/course/subscriptions/cancel",
		tags: ["Course"],
		summary: "Cancel a course subscription",
	})
	.input(z.object({ subscriptionId: z.string().min(1) }))
	.handler(async ({ input, context }) => {
		const reservation = await withInvoiceOperationLock(async (tx) => {
			await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`startkiter:subscription-state:${input.subscriptionId}`}, 0))`;
			const subscription = await tx.courseSubscription.findUnique({
				where: { id: input.subscriptionId },
				select: { id: true, userId: true, status: true, gatewaySubscriptionId: true, cancellationOperationToken: true, cancellationOperationStartedAt: true },
			});
			if (!subscription || subscription.userId !== context.user.id) return null;
			if (subscription.status === "CANCELED") throw new ORPCError("BAD_REQUEST", { message: "這筆訂閱已取消。" });
			const recoverBeforeCancel = Boolean(
				subscription.cancellationOperationToken &&
				isStaleCancellation(subscription.cancellationOperationStartedAt),
			);
			if (subscription.cancellationOperationToken && !recoverBeforeCancel) {
				throw new ORPCError("CONFLICT", { message: "這筆訂閱取消作業正在處理中。" });
			}
			const operationToken = randomUUID();
			const claimed = await tx.courseSubscription.updateMany({
				where: {
					id: subscription.id,
					userId: context.user.id,
					status: "ACTIVE",
					OR: [{ cancellationOperationToken: null }, { cancellationOperationStartedAt: null }, { cancellationOperationStartedAt: { lte: new Date(Date.now() - CANCELLATION_LEASE_MS) } }],
				},
				data: { cancellationOperationToken: operationToken, cancellationOperationStartedAt: new Date(), cancellationError: null },
			});
			if (claimed.count !== 1) throw new ORPCError("CONFLICT", { message: "這筆訂閱取消作業正在處理中。" });
			return { subscription, operationToken, recoverBeforeCancel };
		});
		if (!reservation) throw new ORPCError("NOT_FOUND");

		const gateway = await getPayUniSubscriptionGateway();
		if (!gateway) {
			await withInvoiceOperationLock(async (tx) => {
				await tx.courseSubscription.updateMany({
					where: { id: reservation.subscription.id, cancellationOperationToken: reservation.operationToken },
					data: { cancellationOperationToken: null, cancellationOperationStartedAt: null, cancellationError: "PAYUNi 尚未完成設定。" },
				});
			});
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "PAYUNi 尚未完成設定。" });
		}
		if (reservation.recoverBeforeCancel && reservation.subscription.gatewaySubscriptionId) {
			let remoteCancellationStatus: "ACTIVE" | "CANCELED" | "UNKNOWN";
			try {
				remoteCancellationStatus = (await gateway.queryPeriod(reservation.subscription.gatewaySubscriptionId)).cancellationStatus;
			} catch (error) {
				await withInvoiceOperationLock(async (tx) => {
					await tx.courseSubscription.updateMany({
						where: { id: reservation.subscription.id, status: "ACTIVE", cancellationOperationToken: reservation.operationToken },
						data: { cancellationError: error instanceof Error ? error.message : "取消結果查詢失敗，請稍後重試。" },
					});
				});
				throw new ORPCError("CONFLICT", { message: "取消結果待查，請稍後重試。" });
			}
			if (remoteCancellationStatus === "UNKNOWN") {
				await withInvoiceOperationLock(async (tx) => {
					await tx.courseSubscription.updateMany({
						where: { id: reservation.subscription.id, status: "ACTIVE", cancellationOperationToken: reservation.operationToken },
						data: { cancellationError: "取消狀態無法確認，請稍後重試或人工查核。" },
					});
				});
				throw new ORPCError("CONFLICT", { message: "取消狀態待查，請稍後重試。" });
			}
			if (remoteCancellationStatus === "CANCELED") {
				const updated = await finalizeLocalCancellation(reservation.subscription.id, reservation.operationToken);
				await handleRefundInvoiceForSubscription(reservation.subscription.id).catch(() => undefined);
				return { subscription: updated };
			}
		}
		const result = await gateway.cancelSubscription({
			gatewaySubscriptionId: reservation.subscription.gatewaySubscriptionId ?? "",
		});
		if (!result.success) {
			if (result.ambiguous) {
				await withInvoiceOperationLock(async (tx) => {
					await tx.courseSubscription.updateMany({
						where: { id: reservation.subscription.id, status: "ACTIVE", cancellationOperationToken: reservation.operationToken },
						data: { cancellationError: result.error ?? "取消結果待查，請稍後重試。" },
					});
				});
				throw new ORPCError("CONFLICT", { message: "取消結果待查，請稍後重試。" });
			}
			await withInvoiceOperationLock(async (tx) => {
				await tx.courseSubscription.updateMany({
					where: { id: reservation.subscription.id, status: "ACTIVE", cancellationOperationToken: reservation.operationToken },
					data: { cancellationOperationToken: null, cancellationOperationStartedAt: null, cancellationError: result.error ?? "取消訂閱失敗。" },
				});
			});
			throw new ORPCError("BAD_REQUEST", { message: result.error ?? "取消訂閱失敗。" });
		}

		const updated = await finalizeLocalCancellation(reservation.subscription.id, reservation.operationToken);
		// 取消不是 webhook；等待退款發票處理完成，避免 detached promise 在 response 後被執行環境中止。
		await handleRefundInvoiceForSubscription(reservation.subscription.id).catch(() => undefined);
		return { subscription: updated };
	});
