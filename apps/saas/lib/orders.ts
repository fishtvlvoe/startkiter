import { redeemCouponInTransaction } from "@startkiter/coupons";
import { db } from "@startkiter/database";
import { handleRefundInvoice } from "@startkiter/api/modules/course/lib/invoice-events";
import { sendWelcomeEmailsForOrder } from "@startkiter/api/modules/course/lib/send-welcome-email";
import { refundOrderThroughGateway, withOrderStateLock } from "@startkiter/api/modules/course/lib/order-refunds";
import {
	MVP_AMOUNT_TWD,
	MVP_SKU,
	buildPendingOrderInput,
	createMvpCheckoutGateway,
	normalizeInvoicePreference,
	type OrderRecord,
	type InvoicePreferenceInput,
	type CheckoutGatewayType,
} from "@startkiter/payments";

import { loadPayUniCredentials } from "./payuni-credentials";
import { loadGatewayCredentials } from "./checkout-gateway-settings";

export { loadPayUniCredentials } from "./payuni-credentials";

export class CouponCheckoutError extends Error {
	readonly reason: "not_found" | "expired" | "not_started" | "max_redemptions_reached";

	constructor(reason: CouponCheckoutError["reason"]) {
		super(`invalid_coupon:${reason}`);
		this.name = "CouponCheckoutError";
		this.reason = reason;
	}
}

function mapOrderRow(row: {
	id: string;
	userId: string;
	orderNo: string;
	sku: string;
	amount: number;
	currency: string;
	status: string;
	paymentGateway: string;
	gatewayTradeNo: string | null;
	courseAccess: boolean;
	kitClaimEligible: boolean;
	paidAt: Date | null;
	refundedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	couponId?: string | null;
	couponCode?: string | null;
}): OrderRecord & { couponId?: string | null; couponCode?: string | null } {
	return {
		id: row.id,
		userId: row.userId,
		orderNo: row.orderNo,
		sku: row.sku,
		amount: row.amount,
		currency: row.currency,
		status: row.status as OrderRecord["status"],
		paymentGateway: row.paymentGateway as CheckoutGatewayType,
		gatewayTradeNo: row.gatewayTradeNo,
		courseAccess: row.courseAccess,
		kitClaimEligible: row.kitClaimEligible,
		paidAt: row.paidAt,
		refundedAt: row.refundedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		couponId: row.couponId ?? null,
		couponCode: row.couponCode ?? null,
	};
}

function invoicePreferenceData(invoicePreference?: InvoicePreferenceInput) {
	if (!invoicePreference) return {};
	const preference = normalizeInvoicePreference(invoicePreference);
	return {
		invoiceType: preference.invoiceType,
		invoiceCarrierType: preference.carrierType,
		invoiceCarrierId: preference.carrierId || null,
		invoiceTaxId: preference.taxId || null,
		invoiceTitle: preference.title || null,
		invoiceAddress: preference.address || null,
		invoiceLoveCode: preference.loveCode || null,
	};
}

/**
 * 建立 pending 訂單。若帶 couponCode，在同一 transaction 內：
 * 悲觀鎖 coupon → 檢查 timesRedeemed → 遞增 → 寫入 order.couponId/couponCode。
 */
export async function createPendingOrderForUser(
	userId: string,
	amount: number = MVP_AMOUNT_TWD,
	sku: string = MVP_SKU,
	invoicePreference?: InvoicePreferenceInput,
	paymentGateway: CheckoutGatewayType = "payuni",
	couponCode?: string,
	organizationId?: string,
): Promise<OrderRecord & { couponId?: string | null; couponCode?: string | null }> {
	const pending = buildPendingOrderInput({
		userId,
		sku,
		amount,
		paymentGateway,
	});

	try {
		const row = await db.$transaction(
			async (tx) => {
				let chargeAmount = pending.amount;
				let couponId: string | null = null;
				let storedCouponCode: string | null = null;

				if (couponCode && couponCode.trim() !== "") {
					const redeemed = await redeemCouponInTransaction(tx, couponCode, amount);
					if (!redeemed.ok) {
						throw new CouponCheckoutError(redeemed.reason);
					}
					chargeAmount = redeemed.finalAmount;
					couponId = redeemed.couponId;
					storedCouponCode = redeemed.couponCode;
				}

				return tx.order.create({
					data: {
						orderNo: pending.orderNo,
						userId: pending.userId,
						...(organizationId ? { organizationId } : {}),
						sku: pending.sku,
						amount: chargeAmount,
						currency: pending.currency,
						status: "pending",
						paymentGateway,
						courseAccess: false,
						kitClaimEligible: false,
						couponId,
						couponCode: storedCouponCode,
						...invoicePreferenceData(invoicePreference),
					},
				});
			},
			{ maxWait: 10_000, timeout: 30_000 },
		);

		return mapOrderRow(row);
	} catch (error) {
		if (error instanceof CouponCheckoutError) {
			throw error;
		}
		throw error;
	}
}

export async function markOrderPaid(
	orderId: string,
	orderNo: string,
	gatewayTradeNo: string,
	paymentGateway?: CheckoutGatewayType,
) {
	const updated = await withOrderStateLock(orderId, async (tx) => {
		const result = await tx.order.updateMany({
			where: { id: orderId, orderNo, status: "pending", ...(paymentGateway ? { paymentGateway } : {}) },
			data: {
				status: "paid",
				courseAccess: true,
				kitClaimEligible: true,
				gatewayTradeNo,
				paidAt: new Date(),
			},
		});
		return result.count;
	});
	if (updated > 0) void sendWelcomeEmailsForOrder(orderId);
	return updated;
}

export async function findOrderByNo(orderNo: string) {
	return db.order.findUnique({ where: { orderNo } });
}

/**
 * 通用退款：不區分 sku，MVP 單一課程訂單與 bundle 訂單（`sku` = bundle id）都適用。
 * `courseAccess` 一旦被清成 false，`@startkiter/course` 的 `canAccessCourseId`（Phase 2 新增，
 * design.md「Refunded bundle revokes access to all its courses」）在反查買家已授權 sku 清單時
 * 就不會再看到這筆訂單的 sku，因此 bundle 內所有課程的存取權會一併撤銷，不需要另外針對
 * bundle 訂單寫專屬的撤銷邏輯（驗證見 `packages/bundles/src/access-integration.test.ts`）。
 */
export async function markOrderRefundedInDb(orderNo: string) {
	const order = await db.order.findUnique({
		where: { orderNo },
		select: { id: true },
	});
	if (!order) return 0;
	const count = await refundOrderThroughGateway(order.id);
	if (count > 0) {
		await handleRefundInvoice(order.id).catch(() => undefined);
	}
	return count;
}

export async function buildPayuniSession(order: OrderRecord, baseUrl: string, email?: string) {
	const credentials = await loadPayUniCredentials();
	if (!credentials) {
		return null;
	}
	const gateway = createMvpCheckoutGateway("payuni", credentials);
	return gateway.createPaymentSession({
		orderNo: order.orderNo,
		amount: order.amount,
		productTitle: "StartKiter MVP",
		customerEmail: email,
		baseUrl,
	});
}

export async function buildCheckoutSession(order: OrderRecord, baseUrl: string, email?: string) {
	const configured = await loadGatewayCredentials(order.paymentGateway);
	if (!configured) return null;
	const gateway = createMvpCheckoutGateway(configured.gateway, configured.credentials);
	return gateway.createPaymentSession({
		orderNo: order.orderNo,
		amount: order.amount,
		productTitle: "StartKiter MVP",
		customerEmail: email,
		baseUrl,
	});
}
