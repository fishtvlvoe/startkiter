import { dispatchNewsletters } from "@startkiter/newsletter";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const secret = process.env.CRON_SECRET?.trim();
	const authorization = request.headers.get("authorization");
	if (!secret || authorization !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await dispatchNewsletters();
	return NextResponse.json(result, { status: 200 });
}
