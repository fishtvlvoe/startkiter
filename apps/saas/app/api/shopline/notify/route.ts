import { triggerInvoiceForOrder } from "@startkiter/api/modules/course/lib/invoice-events";
import { sendWelcomeEmailsForOrder } from "@startkiter/api/modules/course/lib/send-welcome-email";
import { NextResponse } from "next/server";

import { loadGatewayCredentials } from "../../../../lib/checkout-gateway-settings";
import { findOrderByNo, markOrderPaid } from "../../../../lib/orders";
import { scheduleAfterResponse } from "../../../../lib/schedule-after";
import { ShoplineGateway, type ShoplineConfig } from "@startkiter/payments";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringAt(...values: unknown[]): string {
	return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}

function recordAt(value: unknown, key: string): Record<string, unknown> {
	return isRecord(value) && isRecord(value[key]) ? value[key] : {};
}

function numberAt(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
	return null;
}

export async function POST(request: Request) {
	const configured = await loadGatewayCredentials("shopline");
	if (!configured || configured.gateway !== "shopline") {
		return NextResponse.json({ error: "shopline_not_configured" }, { status: 503 });
	}

	const rawBody = await request.text();
	const timestamp = request.headers.get("timestamp") ?? request.headers.get("x-shopline-timestamp") ?? "";
	const signature = request.headers.get("sign") ?? request.headers.get("x-shopline-signature") ?? "";
	const gateway = new ShoplineGateway(configured.credentials as ShoplineConfig);
	if (!timestamp || !signature || !gateway.verifyWebhookSignature({ timestamp, signature, rawBody })) {
		return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
	}

	let payload: unknown;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}
	if (!isRecord(payload)) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

	const eventType = stringAt(payload.type, payload.eventType, payload.event);
	if (!new Set(["payment.succeeded", "payment.success", "trade.succeeded", "trade.success", "session.completed", "session.succeeded", "session.paid"]).has(eventType)) {
		return NextResponse.json({ ok: true }, { status: 200 });
	}

	const data = isRecord(payload.data) ? payload.data : payload;
	const nestedOrder = recordAt(data, "order");
	const metadata = recordAt(data, "metadata");
	const nestedMetadata = recordAt(nestedOrder, "metadata");
	const orderNo = stringAt(
		data.referenceOrderId,
		data.referenceId,
		data.orderNo,
		metadata.orderNo,
		nestedMetadata.orderNo,
		nestedOrder.referenceOrderId,
		nestedOrder.referenceId,
		payload.referenceOrderId,
	);
	const tradeNo = stringAt(data.tradeOrderId, data.tradeNo, data.transactionId, data.referenceId, data.sessionId);
	if (!orderNo || !tradeNo) return NextResponse.json({ error: "invalid_trade" }, { status: 400 });

	const order = await findOrderByNo(orderNo);
	if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 400 });
	if (order.paymentGateway !== "shopline") return NextResponse.json({ error: "gateway_mismatch" }, { status: 400 });

	const amountObject = recordAt(data, "amount");
	const amount = numberAt(amountObject.value) ?? numberAt(data.amount);
	const currency = stringAt(amountObject.currency, data.currency).toUpperCase();
	const expectedValues = new Set([order.amount, order.amount * 100]);
	if (amount === null || !expectedValues.has(amount) || currency !== order.currency.toUpperCase()) {
		return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
	}

	if (order.status === "paid") return NextResponse.json({ ok: true }, { status: 200 });
	const updated = await markOrderPaid(orderNo, tradeNo, "shopline");
	if (updated === 0) {
		const latest = await findOrderByNo(orderNo);
		if (latest?.status === "paid") return NextResponse.json({ ok: true }, { status: 200 });
		return NextResponse.json({ error: "order_not_pending" }, { status: 400 });
	}

	scheduleAfterResponse(async () => {
		await Promise.all([triggerInvoiceForOrder(order.id), sendWelcomeEmailsForOrder(order.id)]);
	});
	return NextResponse.json({ ok: true }, { status: 200 });
}
