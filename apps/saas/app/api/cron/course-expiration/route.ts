import { scanAndSendExpirationReminders } from "@startkiter/api/modules/course/lib/expiration-reminder-scan";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const secret = process.env.CRON_SECRET?.trim();
	const authorization = request.headers.get("authorization");
	if (!secret || authorization !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await scanAndSendExpirationReminders();
	return NextResponse.json(result, { status: 200 });
}
