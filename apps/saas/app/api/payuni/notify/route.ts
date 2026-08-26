import {
	PayUniOneTimeGateway,
	decidePayuniNotify,
} from "@startkiter/payments";
import { NextResponse } from "next/server";

import { findOrderByNo, loadPayUniCredentials, markOrderPaid } from "../../../../lib/orders";
import { triggerInvoiceForOrder } from "@startkiter/api/modules/course/lib/invoice-events";
import { sendWelcomeEmailsForOrder } from "@startkiter/api/modules/course/lib/send-welcome-email";
import { scheduleAfterResponse } from "../../../../lib/schedule-after";

export async function POST(request: Request) {
	const credentials = await loadPayUniCredentials();
	if (!credentials) {
		return NextResponse.json({ error: "payuni_not_configured" }, { status: 503 });
	}

	const contentType = request.headers.get("content-type") || "";
	let encryptInfo = "";
	let hashInfo = "";

	try {
		if (contentType.includes("application/json")) {
			const body = (await request.json()) as { EncryptInfo?: string; HashInfo?: string };
			encryptInfo = body.EncryptInfo || "";
			hashInfo = body.HashInfo || "";
		} else {
			const form = await request.formData();
			encryptInfo = String(form.get("EncryptInfo") || "");
			hashInfo = String(form.get("HashInfo") || "");
		}
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}

	const gateway = new PayUniOneTimeGateway(credentials);
	let payload: ReturnType<PayUniOneTimeGateway["verifyNotify"]>;
	try {
		payload = gateway.verifyNotify(encryptInfo, hashInfo);
	} catch {
		return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
	}

	const orderNo = typeof payload.MerTradeNo === "string" ? payload.MerTradeNo : "";
	if (!orderNo) {
		return NextResponse.json({ error: "invalid_trade" }, { status: 400 });
	}

	const existing = await findOrderByNo(orderNo);
	if (!existing) {
		return NextResponse.json({ error: "order_not_found" }, { status: 400 });
	}

	if (existing.paymentGateway !== "payuni") {
		return NextResponse.json({ error: "gateway_mismatch" }, { status: 400 });
	}

	const order = {
		id: existing.id,
		userId: existing.userId,
		orderNo: existing.orderNo,
		sku: existing.sku,
		amount: existing.amount,
		currency: existing.currency,
		status: existing.status,
		paymentGateway: "payuni" as const,
		gatewayTradeNo: existing.gatewayTradeNo,
		courseAccess: existing.courseAccess,
		kitClaimEligible: existing.kitClaimEligible,
		paidAt: existing.paidAt,
		refundedAt: existing.refundedAt,
		createdAt: existing.createdAt,
		updatedAt: existing.updatedAt,
	};

	const decision = decidePayuniNotify(order, payload);
	if (decision.status !== 200) {
		return NextResponse.json({ error: decision.error }, { status: 400 });
	}

	if (decision.shouldMarkPaid) {
		const tradeNo = typeof payload.TradeNo === "string" ? payload.TradeNo.trim() : "";
		if (!tradeNo) {
			return NextResponse.json({ error: "missing_trade_no" }, { status: 400 });
		}
		const updated = await markOrderPaid(existing.id, orderNo, tradeNo);
		if (updated === 0) {
			const latest = await findOrderByNo(orderNo);
			if (latest?.status === "paid") {
				scheduleAfterResponse(async () => {
					await Promise.all([
						triggerInvoiceForOrder(existing.id),
						sendWelcomeEmailsForOrder(existing.id),
					]);
				});
				return NextResponse.json({ ok: true }, { status: 200 });
			}
			return NextResponse.json({ error: "order_not_pending" }, { status: 400 });
		}
		scheduleAfterResponse(async () => {
			await Promise.all([
				triggerInvoiceForOrder(existing.id),
				sendWelcomeEmailsForOrder(existing.id),
			]);
		});
	}
	if (!decision.shouldMarkPaid && existing.status === "paid") {
		scheduleAfterResponse(async () => {
			await Promise.all([
				triggerInvoiceForOrder(existing.id),
				sendWelcomeEmailsForOrder(existing.id),
			]);
		});
	}

	return NextResponse.json({ ok: true }, { status: 200 });
}
