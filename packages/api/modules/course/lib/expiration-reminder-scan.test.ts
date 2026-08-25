import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
		db: {
		courseExpirationReminder: { create: vi.fn(), delete: vi.fn() },
		courseSubscription: { findMany: vi.fn() },
		emailDeliveryLog: { create: vi.fn(), update: vi.fn() },
		user: { findUnique: vi.fn() },
	},
}));

vi.mock("@startkiter/mail", () => ({ sendEmail: vi.fn() }));

import { db } from "@startkiter/database";
import { sendEmail } from "@startkiter/mail";

import { scanAndSendExpirationReminders } from "./expiration-reminder-scan";

const now = new Date("2026-08-25T00:00:00.000Z");

function subscription(days: number, status = "ACTIVE") {
	const periodEnd = new Date(now);
	periodEnd.setUTCDate(periodEnd.getUTCDate() + days);
	return {
		id: `subscription-${days}`,
		userId: "user-1",
		courseId: "course-1",
		status,
		currentPeriodEnd: periodEnd,
		user: { email: "fish@example.com", name: "Fish", locale: "zh-tw" },
		course: { title: "開站包", slug: "startkiter" },
	};
}

describe("scanAndSendExpirationReminders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.setSystemTime(now);
		vi.mocked(db.courseSubscription.findMany).mockResolvedValue([
			subscription(7),
			subscription(1),
			subscription(0),
		] as never);
		vi.mocked(db.courseExpirationReminder.create).mockResolvedValue({ id: "reminder-1" } as never);
		vi.mocked(db.courseExpirationReminder.delete).mockResolvedValue({ id: "reminder-1" } as never);
		vi.mocked(db.emailDeliveryLog.create).mockResolvedValue({ id: "delivery-1" } as never);
		vi.mocked(db.emailDeliveryLog.update).mockResolvedValue({ id: "delivery-1" } as never);
		vi.mocked(sendEmail).mockResolvedValue(true);
	});

	it("sends reminders for the 7, 1, and 0 day thresholds", async () => {
		await expect(scanAndSendExpirationReminders()).resolves.toEqual({ sent: 3, skipped: 0, failed: 0 });

		expect(sendEmail).toHaveBeenCalledTimes(3);
		expect(db.courseExpirationReminder.create).toHaveBeenCalledTimes(3);
	});

	it("skips a threshold that has already been recorded", async () => {
		vi.mocked(db.courseExpirationReminder.create).mockRejectedValueOnce({ code: "P2002" });

		await expect(scanAndSendExpirationReminders()).resolves.toEqual({ sent: 2, skipped: 1, failed: 0 });
		expect(sendEmail).toHaveBeenCalledTimes(2);
	});

	it("uses the compound unique reservation before sending under a concurrent duplicate", async () => {
		vi.mocked(db.courseExpirationReminder.create).mockRejectedValueOnce({ code: "P2002" });

		await scanAndSendExpirationReminders();

		expect(db.courseExpirationReminder.create.mock.invocationCallOrder[0]).toBeLessThan(
			sendEmail.mock.invocationCallOrder[0],
		);
		expect(sendEmail).toHaveBeenCalledTimes(2);
	});

	it("does not send reminders for non-active subscriptions", async () => {
		vi.mocked(db.courseSubscription.findMany).mockResolvedValue([subscription(7, "CANCELED")] as never);

		await expect(scanAndSendExpirationReminders()).resolves.toEqual({ sent: 0, skipped: 0, failed: 0 });
		expect(sendEmail).not.toHaveBeenCalled();
	});
});
