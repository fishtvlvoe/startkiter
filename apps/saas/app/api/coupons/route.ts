import { auth } from "@startkiter/auth";
import { createCoupon } from "@startkiter/coupons";
import { operatorHttpStatus, type OperatorSession } from "@startkiter/permissions";
import { NextResponse } from "next/server";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = operatorHttpStatus(session, process.env.ADMIN_EMAIL);
	if (status === 401) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}
	if (status === 403) {
		return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
	}

	let body: Record<string, unknown>;
	try {
		const parsed: unknown = await request.json();
		if (!isPlainObject(parsed)) {
			return NextResponse.json({ error: "invalid_body" }, { status: 400 });
		}
		body = parsed;
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}

	const {
		code,
		discountType,
		amountOff,
		percentOff,
		maxDiscountAmount,
		maxRedemptions,
		startsAt,
		expiresAt,
	} = body;

	if (typeof code !== "string" || code.trim() === "") {
		return NextResponse.json({ error: "invalid" }, { status: 400 });
	}

	if (discountType !== "amount" && discountType !== "percent") {
		return NextResponse.json({ error: "invalid" }, { status: 400 });
	}

	const result = await createCoupon({
		code,
		discountType,
		amountOff: typeof amountOff === "number" ? amountOff : (amountOff ? Number(amountOff) : null),
		percentOff: typeof percentOff === "number" ? percentOff : (percentOff ? Number(percentOff) : null),
		maxDiscountAmount: typeof maxDiscountAmount === "number" ? maxDiscountAmount : (maxDiscountAmount ? Number(maxDiscountAmount) : null),
		maxRedemptions: typeof maxRedemptions === "number" ? maxRedemptions : (maxRedemptions ? Number(maxRedemptions) : null),
		startsAt: startsAt ? new Date(startsAt as string) : null,
		expiresAt: expiresAt ? new Date(expiresAt as string) : null,
	});

	if (!result.ok) {
		if (result.reason === "duplicate") {
			return NextResponse.json({ error: "duplicate" }, { status: 409 });
		}
		return NextResponse.json({ error: "invalid" }, { status: 400 });
	}

	return NextResponse.json({ id: result.id, code: result.code }, { status: 201 });
}
