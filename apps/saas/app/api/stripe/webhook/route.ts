import { triggerInvoiceForOrder } from "@startkiter/api/modules/course/lib/invoice-events";
import { sendWelcomeEmailsForOrder } from "@startkiter/api/modules/course/lib/send-welcome-email";
import { NextResponse } from "next/server";

import { loadGatewayCredentials } from "../../../../lib/checkout-gateway-settings";
import { findOrderByNo, markOrderPaid } from "../../../../lib/orders";
import { scheduleAfterResponse } from "../../../../lib/schedule-after";
import { StripeGateway, toStripeTwdAmount, type StripeCheckoutConfig } from "@startkiter/payments";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
	const configured = await loadGatewayCredentials("stripe");
	if (!configured || configured.gateway !== "stripe") {
		return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
	}

	const rawBody = await request.text();
	const signature = request.headers.get("stripe-signature") ?? "";
	if (!signature) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

	let event;
	try {
		const gateway = new StripeGateway(configured.credentials as StripeCheckoutConfig);
		event = gateway.constructWebhookEvent(rawBody, signature);
	} catch {
		return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
	}

	if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
		return NextResponse.json({ ok: true }, { status: 200 });
	}
	const session = event.data.object;
	if (!isRecord(session) || session.mode !== "payment" || session.payment_status !== "paid") {
		return NextResponse.json({ error: "payment_not_completed" }, { status: 400 });
	}

	const metadata = isRecord(session.metadata) ? session.metadata : {};
	const orderNo = stringValue(metadata.orderNo);
	const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : "";
	if (!orderNo || !paymentIntent) return NextResponse.json({ error: "invalid_trade" }, { status: 400 });

	const order = await findOrderByNo(orderNo);
	if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 400 });
	if (order.paymentGateway !== "stripe") return NextResponse.json({ error: "gateway_mismatch" }, { status: 400 });
	const expectedStripeAmount = toStripeTwdAmount(order.amount);
	if (session.amount_total !== expectedStripeAmount || stringValue(session.currency).toLowerCase() !== order.currency.toLowerCase()) {
		return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
	}
	if (order.status === "paid") {
		scheduleAfterResponse(async () => {
			await Promise.all([triggerInvoiceForOrder(order.id), sendWelcomeEmailsForOrder(order.id)]);
		});
		return NextResponse.json({ ok: true }, { status: 200 });
	}

	const updated = await markOrderPaid(order.id, orderNo, paymentIntent, "stripe");
	if (updated === 0) {
		const latest = await findOrderByNo(orderNo);
		if (latest?.status === "paid") {
			scheduleAfterResponse(async () => {
				await Promise.all([triggerInvoiceForOrder(order.id), sendWelcomeEmailsForOrder(order.id)]);
			});
			return NextResponse.json({ ok: true }, { status: 200 });
		}
		return NextResponse.json({ error: "order_not_pending" }, { status: 400 });
	}

	scheduleAfterResponse(async () => {
		await Promise.all([triggerInvoiceForOrder(order.id), sendWelcomeEmailsForOrder(order.id)]);
	});
	return NextResponse.json({ ok: true }, { status: 200 });
}
