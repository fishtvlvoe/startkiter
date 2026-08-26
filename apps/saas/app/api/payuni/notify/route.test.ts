import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({ db: { order: { findUnique: vi.fn(), updateMany: vi.fn() } } }));
vi.mock("../../../../lib/orders", () => ({
	findOrderByNo: vi.fn(),
	loadPayUniCredentials: vi.fn(),
	markOrderPaid: vi.fn(),
}));
vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	triggerInvoiceForOrder: vi.fn(),
}));
vi.mock("@startkiter/api/modules/course/lib/send-welcome-email", () => ({
	sendWelcomeEmailsForOrder: vi.fn(),
}));

import { db } from "@startkiter/database";
import { PayUniService } from "@startkiter/payments";

import { triggerInvoiceForOrder } from "@startkiter/api/modules/course/lib/invoice-events";
import { sendWelcomeEmailsForOrder } from "@startkiter/api/modules/course/lib/send-welcome-email";
import { findOrderByNo, loadPayUniCredentials, markOrderPaid } from "../../../../lib/orders";
import { POST } from "./route";

const credentials = {
	merchantId: "MERCHANT",
	hashKey: "12345678901234567890123456789012",
	hashIV: "1234567890123456",
	apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
};

function signedRequest(): Request {
	const form = new PayUniService(credentials).createFormData({
		MerTradeNo: "ORDER-1",
		TradeNo: "PAYMENT-1",
		Status: "SUCCESS",
		TradeAmt: 8800,
	});
	return new Request("https://startkiter.example/api/payuni/notify", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ EncryptInfo: form.EncryptInfo, HashInfo: form.HashInfo }),
	});
}

describe("PAYUNi one-time notify invoice trigger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadPayUniCredentials).mockResolvedValue(credentials);
		vi.mocked(findOrderByNo).mockResolvedValue({
			id: "order-id",
			userId: "buyer-1",
			orderNo: "ORDER-1",
			sku: "startkiter-mvp",
			amount: 8800,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
			paidAt: null,
			refundedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as never);
		vi.mocked(markOrderPaid).mockResolvedValue(1);
		vi.mocked(db.order.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(sendWelcomeEmailsForOrder).mockResolvedValue(undefined);
	});

	it("keeps payment successful with invoicing disabled and creates no invoice", async () => {
		vi.mocked(triggerInvoiceForOrder).mockResolvedValue(null);

		const response = await POST(signedRequest());

		expect(response.status).toBe(200);
		expect(markOrderPaid).toHaveBeenCalledWith("order-id", "ORDER-1", "PAYMENT-1");
		expect(triggerInvoiceForOrder).toHaveBeenCalledWith("order-id");
		expect(sendWelcomeEmailsForOrder).toHaveBeenCalledWith("order-id");
		expect(db.order).not.toHaveProperty("invoice");
	});

	it("triggers an order-backed invoice after marking the order paid", async () => {
		const response = await POST(signedRequest());

		expect(response.status).toBe(200);
		expect(triggerInvoiceForOrder).toHaveBeenCalledWith("order-id");
	});

	it("does not turn an invoice provider failure into a payment failure", async () => {
		vi.mocked(triggerInvoiceForOrder).mockRejectedValue(new Error("provider unavailable"));

		const response = await POST(signedRequest());

		expect(response.status).toBe(200);
		expect(markOrderPaid).toHaveBeenCalled();
	});
});
