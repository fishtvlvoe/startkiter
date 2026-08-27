import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { db, type Prisma } from "@startkiter/database";

export type WebhookClaim =
	| { status: "CLAIMED"; token: string }
	| { status: "PROCESSING" | "COMPLETED"; token?: never };

const WEBHOOK_CLAIM_LEASE_MS = 5 * 60_000;

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
		const now = new Date();
		const token = randomUUID();
		await db.paymentWebhookEvent.create({
			data: {
				gateway: args.gateway,
				eventId: args.eventId,
				eventType: args.eventType,
				payload: args.payload,
				processingStartedAt: now,
				claimToken: token,
			},
		});
		return { status: "CLAIMED", token };
	} catch (error) {
		if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
			const now = new Date();
			const token = randomUUID();
			const staleBefore = new Date(now.getTime() - WEBHOOK_CLAIM_LEASE_MS);
			const retried = await db.paymentWebhookEvent.updateMany({
				where: {
					gateway: args.gateway,
					eventId: args.eventId,
					OR: [
						{ status: "FAILED" },
						{ status: "PROCESSING", OR: [{ processingStartedAt: null }, { processingStartedAt: { lt: staleBefore } }] },
					],
				},
				data: { status: "PROCESSING", payload: args.payload, error: null, processingStartedAt: now, claimToken: token },
			});
			if (retried.count === 1) return { status: "CLAIMED", token };
			const existing = await db.paymentWebhookEvent.findUnique({
				where: { gateway_eventId: { gateway: args.gateway, eventId: args.eventId } },
				select: { status: true },
			});
			return existing?.status === "COMPLETED" ? { status: "COMPLETED" } : { status: "PROCESSING" };
		}
		throw error;
	}
}

export async function assertWebhookClaim(tx: Prisma.TransactionClient, gateway: string, eventId: string, token: string): Promise<void> {
	const event = await tx.paymentWebhookEvent.findUnique({
		where: { gateway_eventId: { gateway, eventId } },
		select: { status: true, claimToken: true },
	});
	if (event?.status !== "PROCESSING" || event.claimToken !== token) throw new Error("Webhook claim is no longer owned");
}

export async function completeWebhookEvent(gateway: string, eventId: string, token: string): Promise<boolean> {
		const result = await db.paymentWebhookEvent.updateMany({
			where: { gateway, eventId, status: "PROCESSING", claimToken: token },
			data: { status: "COMPLETED", error: null, processingStartedAt: null, claimToken: null },
		});
		return result.count === 1;
}

export async function failWebhookEvent(gateway: string, eventId: string, token: string, error: unknown): Promise<boolean> {
		const result = await db.paymentWebhookEvent.updateMany({
			where: { gateway, eventId, status: "PROCESSING", claimToken: token },
			data: {
				status: "FAILED",
				error: error instanceof Error ? error.message.slice(0, 500) : "Webhook processing failed",
				processingStartedAt: null,
				claimToken: null,
			},
		});
		return result.count === 1;
}
