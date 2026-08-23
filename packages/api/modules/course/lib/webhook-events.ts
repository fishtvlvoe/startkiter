import { createHash } from "node:crypto";
import { db, type Prisma } from "@startkiter/database";

export type WebhookClaim = "CLAIMED" | "DUPLICATE";

export function fingerprintPayUniPeriodEvent(payload: Record<string, unknown>): string {
	const identity = [
		"MerTradeNo",
		"PeriodTradeNo",
		"PeriodOrderNo",
		"ThisPeriod",
		"TradeNo",
		"Status",
	].map((key) => `${key}=${String(payload[key] ?? "")}`);
	return createHash("sha256").update(identity.join("&"), "utf8").digest("hex");
}

export async function claimWebhookEvent(args: {
	gateway: string;
	eventId: string;
	eventType: string;
	payload: Prisma.InputJsonValue;
}): Promise<WebhookClaim> {
	try {
		await db.paymentWebhookEvent.create({
			data: {
				gateway: args.gateway,
				eventId: args.eventId,
				eventType: args.eventType,
				payload: args.payload,
			},
		});
		return "CLAIMED";
	} catch (error) {
		if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
			const retried = await db.paymentWebhookEvent.updateMany({
				where: { gateway: args.gateway, eventId: args.eventId, status: "FAILED" },
				data: { status: "PROCESSING", payload: args.payload, error: null },
			});
			return retried.count === 1 ? "CLAIMED" : "DUPLICATE";
		}
		throw error;
	}
}

export async function completeWebhookEvent(gateway: string, eventId: string): Promise<void> {
	await db.paymentWebhookEvent.update({
		where: { gateway_eventId: { gateway, eventId } },
		data: { status: "COMPLETED", error: null },
	});
}

export async function failWebhookEvent(gateway: string, eventId: string, error: unknown): Promise<void> {
	await db.paymentWebhookEvent.update({
		where: { gateway_eventId: { gateway, eventId } },
		data: {
			status: "FAILED",
			error: error instanceof Error ? error.message.slice(0, 500) : "Webhook processing failed",
		},
	});
}
