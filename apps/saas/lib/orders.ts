import { db } from "@startkiter/database";
import {
	MVP_AMOUNT_TWD,
	MVP_SKU,
	buildPendingOrderInput,
	createMvpCheckoutGateway,
	resolvePayUniCredentials,
	type OrderRecord,
	type PayUniEnv,
} from "@startkiter/payments";

import { readPayuniSettingsPlain } from "./site-settings";
import type { PayuniPlainSettings } from "./payuni-settings";

export async function loadPayUniCredentials(opts?: {
	readSettings?: () => Promise<PayuniPlainSettings | null>;
	env?: PayUniEnv;
}) {
	const readSettings = opts?.readSettings ?? readPayuniSettingsPlain;
	const env = opts?.env ?? process.env;
	let settings: PayuniPlainSettings | null = null;
	try {
		settings = await readSettings();
	} catch {
		settings = null;
	}

	return resolvePayUniCredentials({
		readSettings: () => settings,
		env,
	});
}

export async function createPendingOrderForUser(userId: string): Promise<OrderRecord> {
	const pending = buildPendingOrderInput({
		userId,
		sku: MVP_SKU,
		amount: MVP_AMOUNT_TWD,
	});
	const row = await db.order.create({
		data: {
			orderNo: pending.orderNo,
			userId: pending.userId,
			sku: pending.sku,
			amount: pending.amount,
			currency: pending.currency,
			status: "pending",
			paymentGateway: "payuni",
			courseAccess: false,
			kitClaimEligible: false,
		},
	});
	return {
		id: row.id,
		userId: row.userId,
		orderNo: row.orderNo,
		sku: row.sku,
		amount: row.amount,
		currency: row.currency,
		status: row.status,
		paymentGateway: "payuni",
		gatewayTradeNo: row.gatewayTradeNo,
		courseAccess: row.courseAccess,
		kitClaimEligible: row.kitClaimEligible,
		paidAt: row.paidAt,
		refundedAt: row.refundedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

export async function markOrderPaid(orderNo: string, gatewayTradeNo: string) {
	const result = await db.order.updateMany({
		where: { orderNo, status: "pending" },
		data: {
			status: "paid",
			courseAccess: true,
			kitClaimEligible: true,
			gatewayTradeNo,
			paidAt: new Date(),
		},
	});
	return result.count;
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
	const result = await db.order.updateMany({
		where: { orderNo, status: { in: ["pending", "paid"] } },
		data: {
			status: "refunded",
			courseAccess: false,
			kitClaimEligible: false,
			refundedAt: new Date(),
		},
	});
	return result.count;
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
