import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import type { CheckoutGateway, CheckoutPaymentSessionResult, RefundResult } from "../../types";

const SANDBOX_BASE_URL = "https://api-sandbox.shoplinepayments.com";
const LIVE_BASE_URL = "https://api.shoplinepayments.com";
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;
const API_TIMEOUT_MS = 15_000;

export type ShoplineConfig = {
	merchantId: string;
	apiKey: string;
	clientKey?: string;
	signKey: string;
	testMode: boolean;
};

const SHOPLINE_DEFAULT_PAYMENT_METHODS = ["CreditCard", "VirtualAccount"];
const SHOPLINE_DIGITAL_ADDRESS = {
	countryCode: "TW",
	state: "Taiwan",
	city: "Taipei",
	postalCode: "100",
	street: "Digital Delivery (Online Course)",
};

type ShoplineSessionResponse = {
	sessionId?: string;
	tradeSessionId?: string;
	sessionUrl?: string;
	redirectUrl?: string;
};

type ShoplineRefundResponse = {
	refundOrderId?: string;
	status?: string;
	code?: string;
	msg?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function responseMessage(value: unknown): string {
	if (!isRecord(value)) return "Shopline API request failed";
	const code = typeof value.code === "string" ? value.code : "";
	const message = typeof value.msg === "string" ? value.msg : typeof value.message === "string" ? value.message : "";
	return [code, message].filter(Boolean).join(": ") || "Shopline API request failed";
}

function parseTimestampMs(timestamp: string): number | null {
	if (!/^\d{10,13}$/.test(timestamp)) return null;
	const value = Number(timestamp);
	return timestamp.length === 10 ? value * 1000 : value;
}

function safeEqualHex(actual: string, expected: string): boolean {
	if (!/^[0-9a-f]+$/i.test(actual) || actual.length !== expected.length) return false;
	const actualBytes = Buffer.from(actual, "hex");
	const expectedBytes = Buffer.from(expected, "hex");
	return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function refundIdempotencyKey(params: { gatewayPaymentId: string; orderNo?: string }): string {
	return `refund_${createHash("sha256").update(`${params.orderNo ?? ""}:${params.gatewayPaymentId}`, "utf8").digest("hex").slice(0, 32)}`;
}

export class ShoplineGateway implements CheckoutGateway {
	readonly type = "shopline" as const;

	constructor(private readonly config: ShoplineConfig) {}

	getBaseUrl(): string {
		return this.config.testMode ? SANDBOX_BASE_URL : LIVE_BASE_URL;
	}

	async createPaymentSession(params: {
		orderNo: string;
		amount: number;
		productTitle: string;
		customerEmail?: string;
		baseUrl: string;
	}): Promise<CheckoutPaymentSessionResult> {
		if (!params.customerEmail) throw new Error("Shopline 結帳需要顧客 Email");

		const amountValue = Math.round(params.amount * 100);
		const personalInfo = { email: params.customerEmail, firstName: "學員", lastName: "學員" };
		const response = await this.request<ShoplineSessionResponse>("/api/v1/trade/sessions/create", {
			referenceId: params.orderNo,
			amount: { value: amountValue, currency: "TWD" },
			mode: "regular",
			returnUrl: `${params.baseUrl}/checkout-return?orderNo=${encodeURIComponent(params.orderNo)}`,
			allowPaymentMethodList: SHOPLINE_DEFAULT_PAYMENT_METHODS,
			order: {
				products: [{ id: params.orderNo, name: params.productTitle.slice(0, 128), quantity: 1, amount: { value: amountValue, currency: "TWD" } }],
				shipping: {
					shippingMethod: "digital",
					carrier: "N/A",
					personalInfo,
					address: SHOPLINE_DIGITAL_ADDRESS,
				},
			},
			customer: { referenceCustomerId: params.orderNo, personalInfo },
			billing: { personalInfo, address: SHOPLINE_DIGITAL_ADDRESS },
			client: { ip: "0.0.0.0" },
			metadata: { orderNo: params.orderNo },
		});

		const checkoutUrl = response.sessionUrl ?? response.redirectUrl;
		const gatewaySessionId = response.sessionId ?? response.tradeSessionId;
		if (!checkoutUrl || !gatewaySessionId) throw new Error("Shopline API 回應缺少付款導向資料");
		return { type: "redirect", checkoutUrl, gatewaySessionId };
	}

	async processRefund(params: { gatewayPaymentId: string | null; orderNo?: string; amount?: number; currency?: string }): Promise<RefundResult> {
		if (!params.gatewayPaymentId) return { success: false, error: "缺少 Shopline 交易 ID，無法退款" };
		const amount = params.amount;
		const currency = params.currency?.trim().toUpperCase();
		const refundAmount = typeof amount === "number" && Number.isSafeInteger(amount) && amount > 0 ? amount : null;
		if (refundAmount === null || !currency) {
			return { success: false, error: "缺少 Shopline 退款金額或幣別，無法退款" };
		}
		try {
			const response = await this.request<ShoplineRefundResponse>(
				"/api/v1/trade/refund/create",
				{
					referenceOrderId: `refund_${params.orderNo ?? params.gatewayPaymentId}`,
					tradeOrderId: params.gatewayPaymentId,
					amount: { value: refundAmount * 100, currency },
					reason: "退款",
				},
				refundIdempotencyKey({ gatewayPaymentId: params.gatewayPaymentId, orderNo: params.orderNo }),
			);
			if (response.status !== "SUCCEEDED") {
				return {
					success: false,
					gatewayRefundId: response.refundOrderId,
					error: [response.code, response.msg, response.status].filter(Boolean).join(": ") || "Shopline 退款未成功",
				};
			}
			return { success: true, gatewayRefundId: response.refundOrderId };
		} catch (error) {
			return { success: false, ambiguous: true, error: error instanceof Error ? error.message : "Shopline 退款失敗" };
		}
	}

	verifyWebhookSignature(args: { timestamp: string; signature: string; rawBody: string }): boolean {
		const timestampMs = parseTimestampMs(args.timestamp);
		if (timestampMs === null || Math.abs(Date.now() - timestampMs) > SIGNATURE_MAX_AGE_MS) return false;
		const expected = createHmac("sha256", this.config.signKey).update(`${args.timestamp}.${args.rawBody}`, "utf8").digest("hex");
		return safeEqualHex(args.signature, expected);
	}

	private async request<T>(path: string, body: Record<string, unknown>, requestId = randomUUID().replace(/-/g, "")): Promise<T> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
		let response: Response;
		try {
			response = await fetch(`${this.getBaseUrl()}${path}`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					merchantId: this.config.merchantId,
					apiKey: this.config.apiKey,
					requestId,
				},
				body: JSON.stringify(body),
				signal: controller.signal,
			});
			const payload: unknown = await response.json().catch((error) => {
				if (controller.signal.aborted) throw error;
				return null;
			});
			if (!response.ok) throw new Error(responseMessage(payload));
			return payload as T;
		} catch (error) {
			if (controller.signal.aborted) throw new Error("Shopline API request timed out");
			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}
}
