import { auth } from "@startkiter/auth";
import { recordMarketingConsent } from "@startkiter/newsletter";
import { NextResponse } from "next/server";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 註冊／登入後回寫行銷同意（預設未勾 = 不呼叫或 granted=false）。
 */
export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
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

	const source = body.source === "register" || body.source === "checkout" ? body.source : null;
	if (!source) {
		return NextResponse.json({ error: "invalid_source" }, { status: 400 });
	}

	if (body.granted !== true) {
		return NextResponse.json({ ok: true, skipped: true });
	}

	const forwarded = request.headers.get("x-forwarded-for");
	const ip = forwarded?.split(",")[0]?.trim() || null;

	await recordMarketingConsent({
		userId: session.user.id,
		source,
		granted: true,
		ip,
	});

	return NextResponse.json({ ok: true });
}
