import { createHmac } from "node:crypto";

import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShoplineGateway } from "./provider/shopline/gateway";
import { StripeGateway } from "./provider/stripe/gateway";

const shoplineCredentials = {
	merchantId: "shopline-merchant",
	apiKey: "shopline-api-key",
	clientKey: "shopline-client-key",
	signKey: "shopline-sign-key",
	testMode: true,
};

const checkoutParams = {
	orderNo: "SK20260826abcdef",
	amount: 8800,
	productTitle: "StartKiter 開站包",
	customerEmail: "buyer@example.com",
	baseUrl: "https://startkiter.example",
};

describe("CheckoutGateway provider implementations", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("creates a Shopline redirect session in sandbox mode", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({ sessionId: "sl_session_1", sessionUrl: "https://sandbox.shopline.test/session/1" }),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const result = await new ShoplineGateway(shoplineCredentials).createPaymentSession(checkoutParams);

		expect(result).toEqual({
			type: "redirect",
			checkoutUrl: "https://sandbox.shopline.test/session/1",
			gatewaySessionId: "sl_session_1",
		});
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("api-sandbox.shoplinepayments.com"),
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					merchantId: shoplineCredentials.merchantId,
					apiKey: shoplineCredentials.apiKey,
				}),
			}),
		);
		const request = fetchMock.mock.calls[0]?.[1];
		const body = JSON.parse(String(request?.body));
		expect(body.allowPaymentMethodList).toEqual(["CreditCard", "VirtualAccount"]);
		expect(body.order.shipping).toEqual(expect.objectContaining({
			shippingMethod: "digital",
			carrier: "N/A",
			address: expect.objectContaining({ countryCode: "TW" }),
		}));
		expect(body.customer.referenceCustomerId).toBe(checkoutParams.orderNo);
		expect(body.billing.personalInfo.email).toBe(checkoutParams.customerEmail);
		expect(body.client.ip).toBe("0.0.0.0");
	});

	it("keeps the Shopline timeout active while reading a stalled response body", async () => {
		vi.useFakeTimers();
		try {
			const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => ({
				ok: true,
				status: 200,
				json: () => new Promise<unknown>((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
				}),
			} as Response));
			const pending = new ShoplineGateway(shoplineCredentials).createPaymentSession(checkoutParams);
			const assertion = expect(pending).rejects.toThrow("Shopline API request timed out");

			await vi.advanceTimersByTimeAsync(15_000);
			await assertion;
			expect(fetchMock).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it("creates a Stripe redirect session with the TWD amount in its currency unit", async () => {
		const stripe = new StripeGateway({ secretKey: "sk_test_checkout", webhookSecret: "whsec_test" });
		const createSession = vi.spyOn(stripe.getStripeInstance().checkout.sessions, "create").mockResolvedValue({
			id: "cs_test_1",
			url: "https://checkout.stripe.com/c/pay/cs_test_1",
		} as never);

		const result = await stripe.createPaymentSession(checkoutParams);

		expect(result).toEqual({
			type: "redirect",
			checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1",
			gatewaySessionId: "cs_test_1",
		});
		expect(createSession).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: "payment",
				currency: "twd",
				line_items: [{
					price_data: expect.objectContaining({ unit_amount: 8800, currency: "twd" }),
					quantity: 1,
				}],
			}),
		);
	});

	it("keeps Stripe refunds within the order transaction budget", () => {
		const stripe = new StripeGateway({ secretKey: "sk_test_checkout", webhookSecret: "whsec_test" });

		expect(stripe.getStripeInstance().getApiField("timeout")).toBe(15_000);
		expect(stripe.getStripeInstance().getMaxNetworkRetries()).toBe(0);
	});

	it("dispatches Shopline and Stripe refunds", async () => {
		const shoplineFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ refundOrderId: "sl_refund_1", status: "SUCCEEDED" }), { status: 200, headers: { "content-type": "application/json" } }),
		);
		const shoplineResult = await new ShoplineGateway(shoplineCredentials).processRefund({
			gatewayPaymentId: "sl_trade_1",
			orderNo: checkoutParams.orderNo,
			amount: checkoutParams.amount,
			currency: "TWD",
		});
		expect(shoplineResult).toEqual({ success: true, gatewayRefundId: "sl_refund_1" });
		expect(shoplineFetch).toHaveBeenCalled();
		const refundRequest = shoplineFetch.mock.calls[0]?.[1];
		expect(JSON.parse(String(refundRequest?.body))).toEqual(expect.objectContaining({
			amount: { value: 880000, currency: "TWD" },
			tradeOrderId: "sl_trade_1",
		}));
		expect(new Headers(refundRequest?.headers).get("requestId")).toBeTruthy();

		const stripe = new StripeGateway({ secretKey: "sk_test_checkout", webhookSecret: "whsec_test" });
		const createRefund = vi.spyOn(stripe.getStripeInstance().refunds, "create").mockResolvedValue({
			id: "re_test_1",
			status: "succeeded",
		} as never);
		await expect(stripe.processRefund({ gatewayPaymentId: "pi_test_1", orderNo: checkoutParams.orderNo })).resolves.toEqual({
			success: true,
			gatewayRefundId: "re_test_1",
		});
		expect(createRefund).toHaveBeenCalledWith(
				{ payment_intent: "pi_test_1" },
				expect.objectContaining({ idempotencyKey: `refund_${checkoutParams.orderNo}` }),
			);
	});

	it("uses a stable Shopline idempotency key for repeated refunds", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ refundOrderId: "sl_refund_1", status: "SUCCEEDED" }), { status: 200 }),
		);
		const gateway = new ShoplineGateway(shoplineCredentials);
		const params = {
			gatewayPaymentId: "sl_trade_repeat",
			orderNo: "SK-REPEAT",
			amount: 8800,
			currency: "TWD",
		};

		await gateway.processRefund(params);
		await gateway.processRefund(params);

		const firstHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
		const secondHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);
		expect(firstHeaders.get("requestId")).toBeTruthy();
		expect(secondHeaders.get("requestId")).toBe(firstHeaders.get("requestId"));
	});

	it("does not report a pending Stripe refund as locally complete", async () => {
		const stripe = new StripeGateway({ secretKey: "sk_test_checkout", webhookSecret: "whsec_test" });
		vi.spyOn(stripe.getStripeInstance().refunds, "create").mockResolvedValue({
			id: "re_pending_1",
			status: "pending",
		} as never);

		await expect(stripe.processRefund({ gatewayPaymentId: "pi_test_pending", orderNo: checkoutParams.orderNo })).resolves.toEqual({
			success: false,
			gatewayRefundId: "re_pending_1",
			pending: true,
			error: "Stripe 退款仍在處理中，尚未完成",
		});
	});

	it("does not treat a Shopline HTTP 200 business failure as a successful refund", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ status: "FAILED", code: "1018", msg: "Business error" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		await expect(new ShoplineGateway(shoplineCredentials).processRefund({
			gatewayPaymentId: "sl_trade_1",
			orderNo: checkoutParams.orderNo,
			amount: checkoutParams.amount,
			currency: "TWD",
		})).resolves.toMatchObject({ success: false, error: expect.stringContaining("1018") });
	});

	it("verifies Shopline webhook signatures with a replay window and timing-safe comparison", () => {
		const timestamp = String(Date.now());
		const rawBody = JSON.stringify({ type: "payment.succeeded" });
		const signature = createHmac("sha256", shoplineCredentials.signKey)
			.update(`${timestamp}.${rawBody}`)
			.digest("hex");
		const gateway = new ShoplineGateway(shoplineCredentials);

		expect(gateway.verifyWebhookSignature({ timestamp, signature, rawBody })).toBe(true);
		expect(gateway.verifyWebhookSignature({ timestamp, signature: `${signature}0`, rawBody })).toBe(false);
		expect(
			gateway.verifyWebhookSignature({
				timestamp: String(Date.now() - 10 * 60 * 1000),
				signature,
				rawBody,
			}),
		).toBe(false);
	});
});
