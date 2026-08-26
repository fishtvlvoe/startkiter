import { auth } from "@startkiter/auth";
import { validateCoupon } from "@startkiter/coupons";
import { MVP_SKU, getProduct, invoicePreferenceSchema, type InvoicePreferenceInput } from "@startkiter/payments";
import { NextResponse } from "next/server";

import {
	buildCheckoutSession,
	createPendingOrderForUser,
} from "../../../lib/orders";
import { loadEnabledGatewayCredentials } from "../../../lib/checkout-gateway-settings";
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

	let invoicePreference: InvoicePreferenceInput | undefined;
	if ("invoicePreference" in body) {
		const parsedPreference = invoicePreferenceSchema.safeParse(body.invoicePreference);
		if (!parsedPreference.success) {
			return NextResponse.json({ error: "invalid_invoice_preference" }, { status: 400 });
		}
		invoicePreference = parsedPreference.data;
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

	const configured = await loadEnabledGatewayCredentials();
	if (!configured) return NextResponse.json({ error: "checkout_gateway_not_configured" }, { status: 503 });

	const baseUrl = resolvePublicBaseUrl(process.env.BETTER_AUTH_URL);
	if (!baseUrl) {
		return NextResponse.json({ error: "public_base_url_required" }, { status: 503 });
	}

	const order = invoicePreference
		? await createPendingOrderForUser(session.user.id, amount, product.sku, invoicePreference, configured.gateway)
		: await createPendingOrderForUser(session.user.id, amount, product.sku, undefined, configured.gateway);
	let payment;
	try {
		payment = await buildCheckoutSession(order, baseUrl, session.user.email);
	} catch {
		return NextResponse.json({ error: "checkout_gateway_unavailable" }, { status: 503 });
	}
	if (!payment) {
		return NextResponse.json({ error: "checkout_gateway_not_configured" }, { status: 503 });
	}

	return NextResponse.json({
		orderNo: order.orderNo,
		amount: order.amount,
		currency: order.currency,
		sku: order.sku,
		payment,
	});
}
