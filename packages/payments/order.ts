import { randomBytes } from "node:crypto";

import { MVP_AMOUNT_TWD, MVP_CURRENCY, MVP_SKU } from "./constants";

/** PAYUNi MerTradeNo 保守上限 25；格式對齊 thetu：前綴 + YYYYMMDD + 12 hex。 */
export const MER_TRADE_NO_MAX_LEN = 25;

export type PendingOrderInput = {
	userId: string;
	orderNo: string;
	sku: string;
	amount: number;
	currency: string;
	status: "pending";
	paymentGateway: "payuni";
	gatewayTradeNo: null;
	courseAccess: false;
	kitClaimEligible: false;
};

export function generateOrderNo(now = new Date()): string {
	const dateStr =
		now.getFullYear().toString() +
		(now.getMonth() + 1).toString().padStart(2, "0") +
		now.getDate().toString().padStart(2, "0");
	const random = randomBytes(6).toString("hex");
	const orderNo = `SK${dateStr}${random}`;
	if (orderNo.length > MER_TRADE_NO_MAX_LEN) {
		throw new Error(`OrderNo exceeds PAYUNi MerTradeNo max length ${MER_TRADE_NO_MAX_LEN}`);
	}
	return orderNo;
}

export function buildPendingOrderInput(args: {
	userId: string;
	amount: number;
	sku?: string;
	orderNo?: string;
}): PendingOrderInput {
	const { amount } = args;
	if (amount === undefined || amount === null || Number.isNaN(amount) || amount <= 0) {
		throw new Error("Order amount must be a positive number");
	}
	// amount 由呼叫端（apps/saas/lib/orders.ts）在伺服器端算出（原價，或已驗證過的 coupon 折扣後金額），
	// 這裡只守住上限：不得超過 MVP 原價，防止任何管道把金額灌高。
	if (amount > MVP_AMOUNT_TWD) {
		throw new Error(`Order amount must be at most ${MVP_AMOUNT_TWD}`);
	}

	const sku = args.sku ?? MVP_SKU;
	if (sku !== MVP_SKU) {
		throw new Error(`Order sku must be ${MVP_SKU}`);
	}

	const orderNo = args.orderNo ?? generateOrderNo();
	if (orderNo.length > MER_TRADE_NO_MAX_LEN) {
		throw new Error(`OrderNo exceeds PAYUNi MerTradeNo max length ${MER_TRADE_NO_MAX_LEN}`);
	}

	return {
		userId: args.userId,
		orderNo,
		sku: MVP_SKU,
		amount,
		currency: MVP_CURRENCY,
		status: "pending",
		paymentGateway: "payuni",
		gatewayTradeNo: null,
		courseAccess: false,
		kitClaimEligible: false,
	};
}
