import { auth } from "@startkiter/auth";
import { validateCoupon } from "@startkiter/coupons";
import { MVP_SKU, createMvpCheckoutGateway, getProduct } from "@startkiter/payments";
import { NextResponse } from "next/server";

import {
	buildPayuniSession,
	createPendingOrderForUser,
	loadPayUniCredentials,
} from "../../../lib/orders";
import { resolvePublicBaseUrl } from "../../../lib/public-base-url";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
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

	// productId 未帶時預設 MVP SKU（既有行為不變）；帶了就查商品目錄（Phase 4：MVP 或已發布 bundle）。
	// 金額一律從伺服器端目錄取得，不信任客戶端輸入（spec: Client-supplied alternate amount is ignored）。
	const productId = typeof body.productId === "string" && body.productId ? body.productId : MVP_SKU;
	const product = await getProduct(productId);
	if (product === null) {
		return NextResponse.json({ error: "product_not_found" }, { status: 404 });
	}

	// couponCode 一律伺服器端重新驗證，不信任前端算好的折扣金額（spec: Checkout applies a validated
	// coupon to compute the charged amount），折扣基準是查出來的商品原價，不是寫死的 MVP 金額。
	let amount: number = product.amount;
	if (typeof body.couponCode === "string" && body.couponCode.trim() !== "") {
		const couponResult = await validateCoupon(body.couponCode, product.amount);
		if (!couponResult.valid) {
			return NextResponse.json({ error: "invalid_coupon", reason: couponResult.reason }, { status: 400 });
		}
		amount = couponResult.finalAmount;
	}

	const credentials = await loadPayUniCredentials();
	if (!credentials) {
		return NextResponse.json({ error: "payuni_not_configured" }, { status: 503 });
	}

	try {
		createMvpCheckoutGateway("payuni", credentials);
	} catch {
		return NextResponse.json({ error: "payuni_not_configured" }, { status: 503 });
	}

	const baseUrl = resolvePublicBaseUrl(process.env.BETTER_AUTH_URL);
	if (!baseUrl) {
		return NextResponse.json({ error: "public_base_url_required" }, { status: 503 });
	}

	const order = await createPendingOrderForUser(session.user.id, amount, product.sku);
	const payment = await buildPayuniSession(order, baseUrl, session.user.email);
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
