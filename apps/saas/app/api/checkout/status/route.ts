import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

	const orderNo = new URL(request.url).searchParams.get("orderNo")?.trim();
	if (!orderNo) return NextResponse.json({ error: "order_no_required" }, { status: 400 });

	const order = await db.order.findFirst({
		where: { orderNo, userId: session.user.id },
		select: { status: true },
	});
	if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

	return NextResponse.json({ orderNo, status: order.status }, { headers: { "cache-control": "no-store" } });
}
