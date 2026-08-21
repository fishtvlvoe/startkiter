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

	const sku = args.sku ?? MVP_SKU;
	// amount 由呼叫端（apps/saas/lib/orders.ts，經 packages/payments/catalog.ts 的 getProduct 查
	// 出來，MVP 或 bundle 皆為伺服器端信任來源，非客戶端輸入）算出。MVP SKU 才守「不得超過 8800」這條
	// 上限（coupon 折扣後只會更低，不會更高）；bundle sku 的價格是動態的（各 bundle 自己的 priceTwd），
	// 這裡不知道特定 bundle 的原價上限，交由 getProduct 已經是唯一信任來源這件事來把關，不重複假設。
	if (sku === MVP_SKU && amount > MVP_AMOUNT_TWD) {
		throw new Error(`Order amount must be at most ${MVP_AMOUNT_TWD}`);
	}

	const orderNo = args.orderNo ?? generateOrderNo();
	if (orderNo.length > MER_TRADE_NO_MAX_LEN) {
		throw new Error(`OrderNo exceeds PAYUNi MerTradeNo max length ${MER_TRADE_NO_MAX_LEN}`);
	}

	return {
		userId: args.userId,
		orderNo,
		sku,
		amount,
		currency: MVP_CURRENCY,
		status: "pending",
		paymentGateway: "payuni",
		gatewayTradeNo: null,
		courseAccess: false,
		kitClaimEligible: false,
	};
}
