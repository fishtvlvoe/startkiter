import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
		db: {
			paymentWebhookEvent: {
				create: vi.fn(),
				updateMany: vi.fn(),
				findUnique: vi.fn(),
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
		).resolves.toMatchObject({ status: "CLAIMED", token: expect.any(String) });
		expect(db.paymentWebhookEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: { gateway: "payuni", eventId: "event-1", OR: expect.any(Array) },
			data: expect.objectContaining({ status: "PROCESSING", payload: { PeriodOrderNo: "SUB_1" }, error: null, claimToken: expect.any(String) }),
		}));
	});

	it("returns PROCESSING for an event another worker still owns", async () => {
		vi.mocked(db.paymentWebhookEvent.create).mockRejectedValue({ code: "P2002" });
		vi.mocked(db.paymentWebhookEvent.updateMany).mockResolvedValue({ count: 0 } as never);
		vi.mocked(db.paymentWebhookEvent.findUnique).mockResolvedValue({ status: "PROCESSING" } as never);

		await expect(
			claimWebhookEvent({
				gateway: "payuni",
				eventId: "event-1",
				eventType: "period.paid",
				payload: {} as Prisma.InputJsonValue,
			}),
		).resolves.toEqual({ status: "PROCESSING" });
	});

	it("returns COMPLETED so a replay can retry only its side effects", async () => {
		vi.mocked(db.paymentWebhookEvent.create).mockRejectedValue({ code: "P2002" });
		vi.mocked(db.paymentWebhookEvent.updateMany).mockResolvedValue({ count: 0 } as never);
		vi.mocked(db.paymentWebhookEvent.findUnique).mockResolvedValue({ status: "COMPLETED" } as never);

		await expect(
			claimWebhookEvent({
				gateway: "payuni",
				eventId: "event-1",
				eventType: "period.paid",
				payload: {} as Prisma.InputJsonValue,
			}),
		).resolves.toEqual({ status: "COMPLETED" });
	});

	it("reclaims an expired processing event with a fencing token", async () => {
		vi.mocked(db.paymentWebhookEvent.create).mockRejectedValue({ code: "P2002" });
		vi.mocked(db.paymentWebhookEvent.updateMany).mockResolvedValue({ count: 1 } as never);

		await expect(claimWebhookEvent({
			gateway: "payuni",
			eventId: "event-1",
			eventType: "period.paid",
			payload: {} as Prisma.InputJsonValue,
		})).resolves.toMatchObject({ status: "CLAIMED", token: expect.any(String) });
	});
});
