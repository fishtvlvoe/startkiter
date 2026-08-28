import Stripe from "stripe";

import type { CheckoutGateway, CheckoutPaymentSessionResult, RefundResult } from "../../types";

const STRIPE_TWD_MINOR_UNIT_MULTIPLIER = 100;

export function toStripeTwdAmount(amount: number): number {
	return Math.round(amount * STRIPE_TWD_MINOR_UNIT_MULTIPLIER);
}

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
					unit_amount: toStripeTwdAmount(params.amount),
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
			return { success: false, ambiguous: true, error: error instanceof Error ? error.message : "Stripe 退款失敗" };
		}
	}

	async queryRefund(params: { gatewayPaymentId: string; orderNo?: string; amount?: number; currency?: string }): Promise<{ status: "REFUNDED" | "PENDING" | "NOT_REFUNDED" | "UNKNOWN"; gatewayRefundId?: string; error?: string }> {
		try {
			const refunds = await this.stripe.refunds.list({ payment_intent: params.gatewayPaymentId, limit: 100 });
			const succeeded = refunds.data.filter((item) => item.status === "succeeded");
			const pending = refunds.data.filter((item) => item.status === "pending");
			if (params.amount === undefined) {
				if (succeeded[0]) return { status: "REFUNDED", gatewayRefundId: succeeded[0].id };
				if (pending[0]) return { status: "PENDING", gatewayRefundId: pending[0].id };
			} else {
				const targetAmount = toStripeTwdAmount(params.amount);
				const succeededAmount = succeeded.reduce((total, item) => total + item.amount, 0);
					if (succeededAmount === targetAmount) return { status: "REFUNDED", gatewayRefundId: succeeded[succeeded.length - 1]?.id };
					if (succeededAmount > 0) {
						return { status: "UNKNOWN", gatewayRefundId: succeeded[succeeded.length - 1]?.id, error: `Stripe 已成功部分退款 ${succeededAmount}/${targetAmount}` };
				}
				if (pending[0]) return { status: "PENDING", gatewayRefundId: pending[0].id };
			}
			const refund = refunds.data.find((item) => item.status === "failed" || item.status === "canceled");
			return refund
				? { status: "NOT_REFUNDED", gatewayRefundId: refund.id, error: `Stripe 退款狀態為 ${refund.status}` }
				: { status: "NOT_REFUNDED" };
		} catch (error) {
			return { status: "UNKNOWN", error: error instanceof Error ? error.message : "Stripe 退款查詢失敗" };
		}
	}

	constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
		return this.stripe.webhooks.constructEvent(rawBody, signature, this.config.webhookSecret);
	}
}
