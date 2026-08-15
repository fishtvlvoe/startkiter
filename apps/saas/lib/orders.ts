import { createDatabase } from "@startkiter/database";
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
	const db = createDatabase();
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
	const db = createDatabase();
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
	const db = createDatabase();
	return db.order.findUnique({ where: { orderNo } });
}

export async function markOrderRefundedInDb(orderNo: string) {
	const db = createDatabase();
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
