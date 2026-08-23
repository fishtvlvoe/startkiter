import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		paymentWebhookEvent: {
			create: vi.fn(),
			updateMany: vi.fn(),
		},
	},
}));

import { db, type Prisma } from "@startkiter/database";

import { claimWebhookEvent } from "./webhook-events";

describe("claimWebhookEvent", () => {
	beforeEach(() => vi.clearAllMocks());

	it("reclaims a previously failed event so a provider retry can recover it", async () => {
		vi.mocked(db.paymentWebhookEvent.create).mockRejectedValue({ code: "P2002" });
		vi.mocked(db.paymentWebhookEvent.updateMany).mockResolvedValue({ count: 1 } as never);

		await expect(
			claimWebhookEvent({
				gateway: "payuni",
				eventId: "event-1",
				eventType: "period.paid",
				payload: { PeriodOrderNo: "SUB_1" } as Prisma.InputJsonValue,
			}),
		).resolves.toBe("CLAIMED");
		expect(db.paymentWebhookEvent.updateMany).toHaveBeenCalledWith({
			where: { gateway: "payuni", eventId: "event-1", status: "FAILED" },
			data: { status: "PROCESSING", payload: { PeriodOrderNo: "SUB_1" }, error: null },
		});
	});

	it("does not steal an event that is still processing or already completed", async () => {
		vi.mocked(db.paymentWebhookEvent.create).mockRejectedValue({ code: "P2002" });
		vi.mocked(db.paymentWebhookEvent.updateMany).mockResolvedValue({ count: 0 } as never);

		await expect(
			claimWebhookEvent({
				gateway: "payuni",
				eventId: "event-1",
				eventType: "period.paid",
				payload: {} as Prisma.InputJsonValue,
			}),
		).resolves.toBe("DUPLICATE");
	});
});
