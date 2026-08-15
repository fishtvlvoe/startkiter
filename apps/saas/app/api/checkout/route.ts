import { auth } from "@startkiter/auth";
import { MVP_SKU, createMvpCheckoutGateway } from "@startkiter/payments";
import { NextResponse } from "next/server";

import {
	buildPayuniSession,
	createPendingOrderForUser,
	loadPayUniCredentials,
} from "../../../lib/orders";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
	}

	const credentials = loadPayUniCredentials();
	if (!credentials) {
		return NextResponse.json({ error: "payuni_not_configured" }, { status: 503 });
	}

	try {
		createMvpCheckoutGateway("payuni", credentials);
	} catch {
		return NextResponse.json({ error: "payuni_not_configured" }, { status: 503 });
	}

	let body: Record<string, unknown> = {};
	const contentType = request.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		try {
			const parsed: unknown = await request.json();
			if (parsed === null || parsed === undefined) {
				body = {};
			} else if (!isPlainObject(parsed)) {
				return NextResponse.json({ error: "invalid_body" }, { status: 400 });
			} else {
				body = parsed;
			}
		} catch {
			return NextResponse.json({ error: "invalid_body" }, { status: 400 });
		}
	}

	if ("sku" in body) {
		if (typeof body.sku !== "string" || body.sku !== MVP_SKU) {
			return NextResponse.json({ error: "invalid_sku" }, { status: 400 });
		}
	}

	const order = await createPendingOrderForUser(session.user.id);
	const baseUrl = process.env.BETTER_AUTH_URL || new URL(request.url).origin;
	const payment = buildPayuniSession(order, baseUrl, session.user.email);
	if (!payment) {
		return NextResponse.json({ error: "payuni_not_configured" }, { status: 503 });
	}

	return NextResponse.json({
		orderNo: order.orderNo,
		amount: order.amount,
		currency: order.currency,
		sku: order.sku,
		payment,
	});
}
