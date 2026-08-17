import { MVP_AMOUNT_TWD, MVP_CURRENCY, MVP_SKU } from "./constants";
import type { OrderRecord, OrderStore } from "./memory-store";
import type { PayUniCredentials } from "./provider/payuni/gateway";
import { PayUniOneTimeGateway } from "./provider/payuni/gateway";
import type { PayUniResponse } from "./provider/payuni/crypto";

export type NotifyResult = { status: 200 | 400; error?: string; shouldMarkPaid?: boolean };

function parseTradeAmt(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

/** 共用 notify 決策：route 與 in-memory store 都走這條，避免路徑分裂。 */
export function decidePayuniNotify(order: OrderRecord, payload: PayUniResponse): NotifyResult {
	const orderNo = typeof payload.MerTradeNo === "string" ? payload.MerTradeNo : "";
	const status = typeof payload.Status === "string" ? payload.Status : "";
	if (!orderNo || status !== "SUCCESS") {
		return { status: 400, error: "invalid_trade" };
	}

	const tradeAmt = parseTradeAmt(payload.TradeAmt);
	if (tradeAmt === null || tradeAmt !== MVP_AMOUNT_TWD) {
		return { status: 400, error: "amount_mismatch" };
	}

	if (order.orderNo !== orderNo) {
		return { status: 400, error: "order_no_mismatch" };
	}

	if (order.paymentGateway !== "payuni") {
		return { status: 400, error: "gateway_mismatch" };
	}

	if (order.sku !== MVP_SKU || order.amount !== MVP_AMOUNT_TWD || order.currency !== MVP_CURRENCY) {
		return { status: 400, error: "order_mismatch" };
	}

	const tradeNo = typeof payload.TradeNo === "string" ? payload.TradeNo.trim() : "";
	if (!tradeNo) {
		return { status: 400, error: "missing_trade_no" };
	}

	if (order.status === "paid") {
		return { status: 200 };
	}

	if (order.status === "refunded") {
		return { status: 400, error: "order_refunded" };
	}

	return { status: 200, shouldMarkPaid: true };
}

export async function handlePayuniNotify(args: {
	encryptInfo: string;
	hashInfo: string;
	credentials: PayUniCredentials;
	store: OrderStore;
}): Promise<NotifyResult> {
	const gateway = new PayUniOneTimeGateway(args.credentials);
	let payload: PayUniResponse;
	try {
		payload = gateway.verifyNotify(args.encryptInfo, args.hashInfo);
	} catch {
		return { status: 400, error: "invalid_signature" };
	}

	const orderNo = typeof payload.MerTradeNo === "string" ? payload.MerTradeNo : "";
	if (!orderNo) {
		return { status: 400, error: "invalid_trade" };
	}

	const order = args.store.getByOrderNo(orderNo);
	if (!order) {
		return { status: 400, error: "order_not_found" };
	}

	const decision = decidePayuniNotify(order, payload);
	if (decision.status !== 200 || !decision.shouldMarkPaid) {
		return decision;
	}

	args.store.update(orderNo, {
		status: "paid",
		courseAccess: true,
		kitClaimEligible: true,
		gatewayTradeNo: typeof payload.TradeNo === "string" ? payload.TradeNo.trim() : order.gatewayTradeNo,
		paidAt: new Date(),
	});

	return { status: 200 };
}
