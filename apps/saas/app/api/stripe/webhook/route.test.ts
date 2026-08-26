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

const credentials = { secretKey: "sk_test_checkout", webhookSecret: "whsec_test" };
const order = {
	id: "order-id",
	orderNo: "ORDER-1",
	amount: 8800,
	currency: "TWD",
	status: "pending",
	paymentGateway: "stripe",
};

function signedRequest(signatureSecret = credentials.webhookSecret) {
	const payload = JSON.stringify({
		id: "evt_test_1",
		object: "event",
		api_version: "2025-06-30.basil",
		created: Math.floor(Date.now() / 1000),
		data: {
			object: {
				id: "cs_test_1",
				object: "checkout.session",
				mode: "payment",
				payment_status: "paid",
				amount_total: 8800,
				currency: "twd",
				payment_intent: "pi_test_1",
				metadata: { orderNo: "ORDER-1" },
			},
		},
		type: "checkout.session.completed",
	});
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const signedPayload = `${timestamp}.${payload}`;
	const signature = createHmac("sha256", signatureSecret).update(signedPayload, "utf8").digest("hex");
	const header = `t=${timestamp},v1=${signature}`;
	return new Request("https://startkiter.example/api/stripe/webhook", {
		method: "POST",
		headers: { "content-type": "application/json", "stripe-signature": header },
		body: payload,
	});
}

describe("Stripe payment webhook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGatewayCredentials).mockResolvedValue({ gateway: "stripe", credentials });
		vi.mocked(findOrderByNo).mockResolvedValue(order as never);
		vi.mocked(markOrderPaid).mockResolvedValue(1);
		vi.mocked(triggerInvoiceForOrder).mockResolvedValue(null);
	});

	it("marks checkout.session.completed paid and calls the shared invoice hook", async () => {
		const response = await POST(signedRequest());

		expect(response.status).toBe(200);
		expect(markOrderPaid).toHaveBeenCalledWith("order-id", "ORDER-1", "pi_test_1", "stripe");
		expect(triggerInvoiceForOrder).toHaveBeenCalledWith("order-id");
	});

	it("rejects a bad Stripe signature before touching the order", async () => {
		const response = await POST(signedRequest("whsec_wrong"));

		expect(response.status).toBe(400);
		expect(findOrderByNo).not.toHaveBeenCalled();
		expect(markOrderPaid).not.toHaveBeenCalled();
		expect(triggerInvoiceForOrder).not.toHaveBeenCalled();
	});
});
