import { timingSafeEqual } from "node:crypto";

import { retryPendingInvoices } from "@startkiter/api/modules/course/lib/invoice-events";

export const dynamic = "force-dynamic";

function hasValidCronSecret(request: Request): boolean {
	const configured = process.env.CRON_SECRET?.trim();
	if (!configured) return false;
	const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
	const suppliedBuffer = Buffer.from(supplied);
	const configuredBuffer = Buffer.from(configured);
	return suppliedBuffer.length === configuredBuffer.length && timingSafeEqual(suppliedBuffer, configuredBuffer);
}

export async function POST(request: Request) {
	if (!hasValidCronSecret(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
	return Response.json({ ok: true, ...(await retryPendingInvoices()) });
}
