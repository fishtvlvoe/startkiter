import { getBundleById } from "@startkiter/bundles";
import { validateCoupon } from "@startkiter/coupons";
import { MVP_AMOUNT_TWD, MVP_SKU } from "@startkiter/payments";
import { NextResponse } from "next/server";

import { checkRateLimit } from "../../../../lib/rate-limit";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clientIdentifier(request: Request) {
	return request.headers.get("x-forwarded-for") ?? "unknown";
}

async function resolveOriginalAmount(productId: string): Promise<number | null> {
	if (productId === MVP_SKU) {
		return MVP_AMOUNT_TWD;
	}
	const bundle = await getBundleById(productId);
	if (!bundle || bundle.status !== "published") {
		return null;
	}
	return bundle.priceTwd;
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

	const originalAmount = await resolveOriginalAmount(productId);
	if (originalAmount === null) {
		return NextResponse.json({ error: "product_not_found" }, { status: 404 });
	}

	const result = await validateCoupon(body.code, originalAmount);
	return NextResponse.json(result, { status: 200 });
}
