import Stripe from "stripe";

import type { CheckoutGateway, CheckoutPaymentSessionResult, RefundResult } from "../../types";

export type StripeCheckoutConfig = {
	secretKey: string;
	webhookSecret: string;
};

export class StripeGateway implements CheckoutGateway {
	readonly type = "stripe" as const;
	private readonly stripe: Stripe;

	constructor(private readonly config: StripeCheckoutConfig) {
		this.stripe = new Stripe(config.secretKey, { typescript: true, timeout: 15_000, maxNetworkRetries: 0 });
	}

	getStripeInstance(): Stripe {
		return this.stripe;
	}

	getWebhookSecret(): string {
		return this.config.webhookSecret;
	}

	async createPaymentSession(params: {
		orderNo: string;
		amount: number;
		productTitle: string;
		customerEmail?: string;
		baseUrl: string;
	}): Promise<CheckoutPaymentSessionResult> {
		const session = await this.stripe.checkout.sessions.create({
			mode: "payment",
			currency: "twd",
			payment_method_types: ["card"],
			customer_email: params.customerEmail,
			metadata: { orderNo: params.orderNo },
			success_url: `${params.baseUrl}/checkout-return?orderNo=${encodeURIComponent(params.orderNo)}`,
			cancel_url: `${params.baseUrl}/checkout-return?orderNo=${encodeURIComponent(params.orderNo)}&cancelled=1`,
			line_items: [{
				price_data: {
					currency: "twd",
					product_data: { name: params.productTitle.slice(0, 250) },
					unit_amount: Math.round(params.amount),
				},
				quantity: 1,
			}],
		});

		if (!session.url) throw new Error("Stripe API 回應缺少付款導向網址");
		return { type: "redirect", checkoutUrl: session.url, gatewaySessionId: session.id };
	}

	async processRefund(params: { gatewayPaymentId: string | null; orderNo?: string; amount?: number; currency?: string }): Promise<RefundResult> {
		if (!params.gatewayPaymentId) return { success: false, error: "缺少 Stripe Payment Intent ID，無法退款" };
		try {
			const refund = await this.stripe.refunds.create(
				{ payment_intent: params.gatewayPaymentId },
				{ idempotencyKey: `refund_${params.orderNo ?? params.gatewayPaymentId}` },
			);
			if (refund.status === "failed" || refund.status === "canceled") {
				return { success: false, gatewayRefundId: refund.id, error: `Stripe 退款未成功（status=${refund.status}）` };
			}
			return refund.status === "succeeded"
				? { success: true, gatewayRefundId: refund.id }
				: { success: false, gatewayRefundId: refund.id, pending: true, error: "Stripe 退款仍在處理中，尚未完成" };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : "Stripe 退款失敗" };
		}
	}

	constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
		return this.stripe.webhooks.constructEvent(rawBody, signature, this.config.webhookSecret);
	}
}
