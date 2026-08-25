import { db } from "@startkiter/database";
import { sendEmail } from "@startkiter/mail";
import { logger } from "@startkiter/logs";

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = new Set([0, 1, 7]);

function startOfUtcDay(value: Date): Date {
	return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
}

export async function scanAndSendExpirationReminders(): Promise<{
	sent: number;
	skipped: number;
	failed: number;
}> {
	const today = startOfUtcDay(new Date());
	const until = new Date(today.getTime() + 8 * DAY_MS);
	const subscriptions = await db.courseSubscription.findMany({
		where: {
			status: "ACTIVE",
			currentPeriodEnd: { gte: today, lt: until },
		},
		include: {
			user: { select: { email: true, name: true, locale: true } },
			course: { select: { title: true, slug: true } },
		},
	});

	let sent = 0;
	let skipped = 0;
	let failed = 0;

	for (const subscription of subscriptions) {
		if (subscription.status !== "ACTIVE") continue;
		if (!subscription.currentPeriodEnd) continue;
		const daysBefore = Math.round((startOfUtcDay(subscription.currentPeriodEnd).getTime() - today.getTime()) / DAY_MS);
		if (!REMINDER_DAYS.has(daysBefore)) continue;

		const existing = await db.courseExpirationReminder.findUnique({
			where: {
				subscriptionId_daysBefore: {
					subscriptionId: subscription.id,
					daysBefore,
				},
			},
		});
		if (existing) {
			skipped += 1;
			continue;
		}

		const subject = daysBefore === 0
			? `課程「${subscription.course.title}」今天到期`
			: `課程「${subscription.course.title}」將於 ${daysBefore} 天後到期`;
		const text = daysBefore === 0
			? `你的「${subscription.course.title}」訂閱今天到期，請登入課程頁確認續訂狀態。`
			: `你的「${subscription.course.title}」訂閱將於 ${daysBefore} 天後到期，請登入課程頁確認續訂狀態。`;

		let delivery;
		try {
			delivery = await db.emailDeliveryLog.create({
				data: {
					type: "EXPIRATION_REMINDER",
					status: "PENDING",
					subscriptionId: subscription.id,
					userId: subscription.userId,
					courseId: subscription.courseId,
					toEmail: subscription.user.email,
					subject,
				},
			});
			const delivered = await sendEmail({
				to: subscription.user.email,
				locale: subscription.user.locale as Parameters<typeof sendEmail>[0]["locale"],
				subject,
				text,
			});
			if (!delivered) throw new Error("Email provider rejected delivery");

			await db.emailDeliveryLog.update({
				where: { id: delivery.id },
				data: { status: "SENT", sentAt: new Date() },
			});
			await db.courseExpirationReminder.create({
				data: { subscriptionId: subscription.id, daysBefore },
			});
			sent += 1;
		} catch (error) {
			failed += 1;
			if (delivery) {
				await db.emailDeliveryLog.update({
					where: { id: delivery.id },
					data: { status: "FAILED", errorMessage: errorMessage(error) },
				}).catch(() => undefined);
			}
			logger.error(error);
		}
	}

	return { sent, skipped, failed };
}
