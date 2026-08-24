import { PayUniService } from "@startkiter/payments";
import { db, type Prisma } from "@startkiter/database";
import { NextResponse } from "next/server";

import { loadPayUniCredentials } from "../../../../lib/orders";
import {
	claimWebhookEvent,
	completeWebhookEvent,
	failWebhookEvent,
	fingerprintPayUniPeriodEvent,
} from "@startkiter/api/modules/course/lib/webhook-events";
import { triggerInvoiceForSubscriptionPeriod } from "@startkiter/api/modules/course/lib/invoice-events";
import { scheduleAfterResponse } from "../../../../lib/schedule-after";

function stringField(value: unknown): string {
	return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function parseDate(value: unknown): Date | null {
	const raw = stringField(value);
	const match = /^(\d{4})-?(\d{2})-?(\d{2})$/.exec(raw);
	if (!match) return null;
	const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00+08:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

async function readPayload(request: Request): Promise<{ encryptInfo: string; hashInfo: string } | null> {
	const contentType = request.headers.get("content-type") || "";
	try {
		if (contentType.includes("application/json")) {
			const body = (await request.json()) as { EncryptInfo?: unknown; HashInfo?: unknown };
			return { encryptInfo: stringField(body.EncryptInfo), hashInfo: stringField(body.HashInfo) };
		}
		const form = await request.formData();
		return { encryptInfo: stringField(form.get("EncryptInfo")), hashInfo: stringField(form.get("HashInfo")) };
	} catch {
		return null;
	}
}

export async function POST(request: Request) {
	const fields = await readPayload(request);
	if (!fields?.encryptInfo || !fields.hashInfo) {
		return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
	}

	const credentials = await loadPayUniCredentials();
	if (!credentials) {
		return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
	}

	let payload: Record<string, unknown>;
	try {
		payload = new PayUniService(credentials).verifyAndDecrypt(fields.encryptInfo, fields.hashInfo);
	} catch {
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	const merchantId = stringField(payload.MerID || payload.MerchantId);
	const merTradeNo = stringField(payload.MerTradeNo);
	const periodTradeNo = stringField(payload.PeriodTradeNo);
	const periodOrderNo = stringField(payload.PeriodOrderNo);
	const periodMatch = /_(\d+)$/.exec(periodOrderNo);
	const periodNumber = periodMatch ? Number(periodMatch[1]) : 0;
	const gatewayTradeNo = periodMatch ? periodOrderNo.slice(0, periodMatch.index) : periodOrderNo;
	const credentialsMerchantId = credentials.merchantId.trim();
	if (
		!merchantId ||
		merchantId !== credentialsMerchantId ||
		!merTradeNo ||
		!periodOrderNo ||
		gatewayTradeNo !== merTradeNo ||
		!Number.isInteger(periodNumber) ||
		periodNumber < 1 ||
		periodNumber > 900
	) {
		return NextResponse.json({ error: "Invalid period identity" }, { status: 400 });
	}

	const status = stringField(payload.Status);
	const isSuccess = status === "SUCCESS";
	const eventId = fingerprintPayUniPeriodEvent(payload);
	let claimed = false;
	try {
		const claim = await claimWebhookEvent({
			gateway: "payuni",
			eventId,
			eventType: `period.${isSuccess ? "paid" : "failed"}`,
			payload: payload as Prisma.InputJsonValue,
		});
		if (claim === "DUPLICATE") {
			return NextResponse.json({ message: "OK" });
		}
		claimed = true;

		const subscription = await db.courseSubscription.findUnique({
			where: { gatewayTradeNo },
			select: {
				id: true,
				status: true,
				pricePerPeriod: true,
				paidPeriods: true,
				gatewaySubscriptionId: true,
				currentPeriodEnd: true,
			},
		});
		if (!subscription) {
			await failWebhookEvent("payuni", eventId, new Error("Subscription not found"));
			claimed = false;
			return NextResponse.json({ error: "Subscription not found" }, { status: 400 });
		}

		if (!isSuccess) {
			await completeWebhookEvent("payuni", eventId);
			claimed = false;
			return NextResponse.json({ message: "OK" });
		}

		const authorizedAmount = Number(payload.AuthAmt ?? payload.TradeAmt);
		if (!Number.isSafeInteger(authorizedAmount) || authorizedAmount !== subscription.pricePerPeriod) {
			throw new Error("Invalid authorized amount");
		}
		if (!periodTradeNo) {
			throw new Error("Missing PeriodTradeNo");
		}
		if (subscription.gatewaySubscriptionId && subscription.gatewaySubscriptionId !== periodTradeNo) {
			throw new Error("PeriodTradeNo does not match subscription");
		}

		const periodEnd = parseDate(payload.NextAuthDate) ?? parseDate(payload.AuthDay);
		if (!periodEnd) {
			throw new Error("Missing valid period end date");
		}
		const periodNumber = subscription.paidPeriods + 1;
		const updateData: Parameters<typeof db.courseSubscription.update>[0]["data"] = {
			status: subscription.status === "PENDING" ? "ACTIVE" : subscription.status,
			gatewaySubscriptionId: subscription.gatewaySubscriptionId ?? periodTradeNo,
			paidPeriods: { increment: 1 },
			lastPaymentAt: new Date(),
		};
		await db.$transaction(async (tx) => {
			if (!subscription.currentPeriodEnd || periodEnd > subscription.currentPeriodEnd) {
				// Keep the max operation in the database so two different period events
				// cannot overwrite a newer period end with an older one.
				await tx.courseSubscription.updateMany({
					where: {
						id: subscription.id,
						OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lt: periodEnd } }],
					},
					data: { currentPeriodEnd: periodEnd },
				});
			}
			await tx.courseSubscription.update({ where: { id: subscription.id }, data: updateData });
			await tx.paymentWebhookEvent.update({
				where: { gateway_eventId: { gateway: "payuni", eventId } },
				data: { status: "COMPLETED", error: null },
			});
			});
			claimed = false;
		scheduleAfterResponse(async () => {
			await triggerInvoiceForSubscriptionPeriod(subscription.id, periodNumber);
		});
		return NextResponse.json({ message: "OK" });
	} catch (error) {
		if (claimed) {
			await failWebhookEvent("payuni", eventId, error).catch(() => undefined);
		}
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
