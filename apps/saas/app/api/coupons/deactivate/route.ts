import { auth } from "@startkiter/auth";
import { deactivateCoupon } from "@startkiter/coupons";
import { operatorHttpStatus } from "@startkiter/permissions";
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

	const { code } = body;
	if (typeof code !== "string" || code.trim() === "") {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	const result = await deactivateCoupon(code);
	if (!result.ok) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true }, { status: 200 });
}
