import { NextResponse } from "next/server";

import { runNewsletterDispatchTick } from "@startkiter/newsletter";

export async function GET(request: Request) {
	const secret = process.env.CRON_SECRET?.trim();
	const authorization = request.headers.get("authorization");
	if (!secret || authorization !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await runNewsletterDispatchTick();
	return NextResponse.json(result, { status: 200 });
}
