import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		$transaction: vi.fn(),
		courseSubscription: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
		paymentWebhookEvent: { update: vi.fn() },
	},
}));

vi.mock("../../../../lib/orders", () => ({
	loadPayUniCredentials: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/webhook-events", () => ({
	claimWebhookEvent: vi.fn(),
	completeWebhookEvent: vi.fn(),
	failWebhookEvent: vi.fn(),
	fingerprintPayUniPeriodEvent: vi.fn(() => "event-1"),
}));

vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	triggerInvoiceForSubscriptionPeriod: vi.fn(),
}));
vi.mock("@startkiter/api/modules/course/lib/send-welcome-email", () => ({
	sendWelcomeEmail: vi.fn(),
}));

import { db } from "@startkiter/database";
import { PayUniService } from "@startkiter/payments";

import { loadPayUniCredentials } from "../../../../lib/orders";
import {
	claimWebhookEvent,
	completeWebhookEvent,
	failWebhookEvent,
} from "@startkiter/api/modules/course/lib/webhook-events";
import { triggerInvoiceForSubscriptionPeriod } from "@startkiter/api/modules/course/lib/invoice-events";
import { sendWelcomeEmail } from "@startkiter/api/modules/course/lib/send-welcome-email";
import { POST } from "./route";

const credentials = {
	merchantId: "MERCHANT",
	hashKey: "12345678901234567890123456789012",
	hashIV: "1234567890123456",
	apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
};

function signedRequest(overrides: Record<string, unknown> = {}, hashOverride?: string): Request {
	const service = new PayUniService(credentials);
	const form = service.createFormData({
		MerTradeNo: "SUBTRADE",
		PeriodTradeNo: "PERIOD-1",
		PeriodOrderNo: "SUBTRADE_1",
		Status: "SUCCESS",
		AuthAmt: 390,
		ThisPeriod: 1,
		NextAuthDate: "2026-09-23",
		TradeNo: "PAYMENT-1",
		...overrides,
	});
	const body = new FormData();
	body.append("EncryptInfo", form.EncryptInfo);
	body.append("HashInfo", hashOverride ?? form.HashInfo);
	return new Request("https://startkiter.example/api/payuni/period-notify", {
		method: "POST",
		body,
	});
}

describe("PAYUNi period-notify", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadPayUniCredentials).mockResolvedValue(credentials);
		vi.mocked(claimWebhookEvent).mockResolvedValue("CLAIMED");
		vi.mocked(completeWebhookEvent).mockResolvedValue(undefined);
		vi.mocked(failWebhookEvent).mockResolvedValue(undefined);
		vi.mocked(triggerInvoiceForSubscriptionPeriod).mockResolvedValue(null);
		vi.mocked(sendWelcomeEmail).mockResolvedValue(undefined);
		vi.mocked(db.courseSubscription.findUnique).mockResolvedValue({
			id: "subscription-1",
			status: "PENDING",
			pricePerPeriod: 390,
			gatewaySubscriptionId: null,
			currentPeriodEnd: null,
			paidPeriods: 0,
		} as never);
		vi.mocked(db.courseSubscription.update).mockResolvedValue({ id: "subscription-1" } as never);
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(db as never));
	});

	it("activates a pending subscription on the first successful period payment", async () => {
		const response = await POST(signedRequest());

		expect(response.status).toBe(200);
		expect(db.courseSubscription.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "subscription-1" },
				data: expect.objectContaining({
					status: "ACTIVE",
					gatewaySubscriptionId: "PERIOD-1",
					paidPeriods: { increment: 1 },
				}),
			}),
		);
		expect(db.paymentWebhookEvent.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { gateway_eventId: { gateway: "payuni", eventId: "event-1" } },
				data: { status: "COMPLETED", error: null },
			}),
		);
		expect(triggerInvoiceForSubscriptionPeriod).toHaveBeenCalledWith("subscription-1", 1);
		expect(sendWelcomeEmail).toHaveBeenCalledWith(expect.objectContaining({
			subscriptionId: "subscription-1",
		}));
	});

	it("keeps subscription payment success when invoice issuance fails", async () => {
		vi.mocked(triggerInvoiceForSubscriptionPeriod).mockRejectedValue(new Error("provider unavailable"));

		const response = await POST(signedRequest());

		expect(response.status).toBe(200);
		expect(db.courseSubscription.update).toHaveBeenCalled();
	});

	it("returns OK and skips state changes for a duplicate event", async () => {
		vi.mocked(claimWebhookEvent).mockResolvedValue("DUPLICATE");

		const response = await POST(signedRequest());

		expect(response.status).toBe(200);
		expect(db.courseSubscription.findUnique).not.toHaveBeenCalled();
		expect(db.courseSubscription.update).not.toHaveBeenCalled();
	});

	it("rejects a bad signature before claiming or changing state", async () => {
		const response = await POST(signedRequest({}, "invalid"));

		expect(response.status).toBe(400);
		expect(claimWebhookEvent).not.toHaveBeenCalled();
		expect(db.courseSubscription.update).not.toHaveBeenCalled();
	});

	it("does not regress a later period end when a late event arrives", async () => {
		vi.mocked(db.courseSubscription.findUnique).mockResolvedValue({
			id: "subscription-1",
			status: "ACTIVE",
			pricePerPeriod: 390,
			gatewaySubscriptionId: "PERIOD-1",
			currentPeriodEnd: new Date("2026-10-23T00:00:00.000Z"),
		} as never);

		const response = await POST(signedRequest({
			PeriodOrderNo: "SUBTRADE_2",
			ThisPeriod: 2,
			NextAuthDate: "2026-09-23",
		}));

		expect(response.status).toBe(200);
		const update = vi.mocked(db.courseSubscription.update).mock.calls[0]?.[0];
		expect(update?.data).not.toHaveProperty("currentPeriodEnd");
	});
});
