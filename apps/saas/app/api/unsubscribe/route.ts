import { applyUnsubscribe, verifyUnsubscribeToken } from "@startkiter/newsletter";
import { NextResponse } from "next/server";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * POST 才寫入退訂；GET 請走 /unsubscribe 頁面（唯讀）。
 */
export async function POST(request: Request) {
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

	const email = typeof body.email === "string" ? body.email : "";
	const token = typeof body.token === "string" ? body.token : "";
	const campaignId = typeof body.campaignId === "string" && body.campaignId ? body.campaignId : null;

	const verified = verifyUnsubscribeToken({ token, email });
	if (!verified.ok || !verified.userId || !verified.scope) {
		return NextResponse.json({ error: "invalid_token" }, { status: 400 });
	}

	await applyUnsubscribe({
		userId: verified.userId,
		email,
		scope: verified.scope,
		campaignId,
		source: "unsubscribe_api",
	});

	return NextResponse.json({
		ok: true,
		scope: verified.scope,
	});
}

export async function GET() {
	return NextResponse.json(
		{ error: "use_unsubscribe_page", message: "GET does not mutate consent; open /unsubscribe" },
		{ status: 405 },
	);
}
