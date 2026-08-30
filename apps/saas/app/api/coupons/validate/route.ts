import { validateCoupon } from "@startkiter/coupons";
import { MVP_SKU, getProduct } from "@startkiter/payments";
import { NextResponse } from "next/server";

import { checkRateLimit, resolveTrustedClientIp } from "../../../../lib/rate-limit";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clientIdentifier(request: Request) {
	return resolveTrustedClientIp(request.headers.get("x-forwarded-for"));
}

export async function POST(request: Request) {
	if (!checkRateLimit(`coupon-validate:${clientIdentifier(request)}`, { limit: 20, windowMs: 60_000 })) {
		return NextResponse.json({ error: "rate_limited" }, { status: 429 });
	}

	let body: Record<string, unknown> = {};
	try {
		const parsed: unknown = await request.json();
		if (!isPlainObject(parsed)) {
			return NextResponse.json({ error: "invalid_body" }, { status: 400 });
		}
		body = parsed;
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}

	if (typeof body.code !== "string" || body.code.trim() === "") {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}
	const productId = typeof body.productId === "string" && body.productId ? body.productId : MVP_SKU;

	const product = await getProduct(productId);
	if (product === null) {
		return NextResponse.json({ error: "product_not_found" }, { status: 404 });
	}

	const result = await validateCoupon(body.code, product.amount);
	return NextResponse.json(result, { status: 200 });
}
