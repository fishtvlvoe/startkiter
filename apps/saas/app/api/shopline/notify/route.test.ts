import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/checkout-gateway-settings", () => ({
	loadGatewayCredentials: vi.fn(),
}));
vi.mock("../../../../lib/orders", () => ({
	findOrderByNo: vi.fn(),
	markOrderPaid: vi.fn(),
}));
vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	triggerInvoiceForOrder: vi.fn(),
}));
vi.mock("@startkiter/api/modules/course/lib/send-welcome-email", () => ({
	sendWelcomeEmailsForOrder: vi.fn(),
}));
vi.mock("../../../../lib/schedule-after", () => ({
	scheduleAfterResponse: vi.fn((task: () => Promise<void>) => void task()),
}));

import { triggerInvoiceForOrder } from "@startkiter/api/modules/course/lib/invoice-events";
import { loadGatewayCredentials } from "../../../../lib/checkout-gateway-settings";
import { findOrderByNo, markOrderPaid } from "../../../../lib/orders";
import { POST } from "./route";

const credentials = {
	merchantId: "shopline-merchant",
	apiKey: "shopline-api-key",
	clientKey: "shopline-client-key",
	signKey: "shopline-sign-key",
	testMode: true,
};

const order = {
	id: "order-id",
	orderNo: "ORDER-1",
	amount: 8800,
	currency: "TWD",
	status: "pending",
	paymentGateway: "shopline",
};

function signedRequest(body: string, signKey = credentials.signKey) {
	const timestamp = String(Date.now());
	const signature = createHmac("sha256", signKey).update(`${timestamp}.${body}`, "utf8").digest("hex");
	return new Request("https://startkiter.example/api/shopline/notify", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			timestamp,
			sign: signature,
		},
		body,
	});
}

describe("Shopline payment notify", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGatewayCredentials).mockResolvedValue({ gateway: "shopline", credentials });
		vi.mocked(findOrderByNo).mockResolvedValue(order as never);
		vi.mocked(markOrderPaid).mockResolvedValue(1);
		vi.mocked(triggerInvoiceForOrder).mockResolvedValue(null);
	});

	it("marks a signed successful payment paid and calls the shared invoice hook", async () => {
		const body = JSON.stringify({
			type: "payment.succeeded",
			data: { referenceOrderId: "ORDER-1", tradeOrderId: "sl_trade_1", amount: { value: 880000, currency: "TWD" } },
		});

		const response = await POST(signedRequest(body));

		expect(response.status).toBe(200);
		expect(markOrderPaid).toHaveBeenCalledWith("order-id", "ORDER-1", "sl_trade_1", "shopline");
		expect(triggerInvoiceForOrder).toHaveBeenCalledWith("order-id");
	});

	it("rejects an invalid signature before reading or changing the order", async () => {
		const body = JSON.stringify({
			type: "payment.succeeded",
			data: { referenceOrderId: "ORDER-1", tradeOrderId: "sl_trade_1", amount: { value: 880000, currency: "TWD" } },
		});

		const response = await POST(signedRequest(body, "wrong-sign-key"));

		expect(response.status).toBe(400);
		expect(findOrderByNo).not.toHaveBeenCalled();
		expect(markOrderPaid).not.toHaveBeenCalled();
		expect(triggerInvoiceForOrder).not.toHaveBeenCalled();
	});

	it("rejects a signed success notification without an exact currency", async () => {
		const body = JSON.stringify({
			type: "payment.succeeded",
			data: { referenceOrderId: "ORDER-1", tradeOrderId: "sl_trade_1", amount: { value: 880000 } },
		});

		const response = await POST(signedRequest(body));

		expect(response.status).toBe(400);
		expect(markOrderPaid).not.toHaveBeenCalled();
		expect(triggerInvoiceForOrder).not.toHaveBeenCalled();
	});

	it("does not use a reference or session id as the refund transaction id", async () => {
		const body = JSON.stringify({
			type: "payment.succeeded",
			data: { referenceId: "ORDER-1", sessionId: "sl_session_1", amount: { value: 8800, currency: "TWD" } },
		});

		const response = await POST(signedRequest(body));

		expect(response.status).toBe(400);
		expect(findOrderByNo).not.toHaveBeenCalled();
		expect(markOrderPaid).not.toHaveBeenCalled();
	});

	it("rejects a major-unit amount when Shopline sends minor units", async () => {
		const body = JSON.stringify({
			type: "payment.succeeded",
			data: { referenceOrderId: "ORDER-1", tradeOrderId: "sl_trade_1", amount: { value: 8800, currency: "TWD" } },
		});

		const response = await POST(signedRequest(body));

		expect(response.status).toBe(400);
		expect(markOrderPaid).not.toHaveBeenCalled();
		expect(triggerInvoiceForOrder).not.toHaveBeenCalled();
	});
});
