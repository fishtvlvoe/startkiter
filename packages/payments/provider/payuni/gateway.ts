import { PayUniService } from "./crypto";
import type { CheckoutGateway, RefundResult } from "../../types";

const REFUND_TOTAL_TIMEOUT_MS = 25_000;
const REFUND_REQUEST_TIMEOUT_MS = 10_000;

function tradeEndpoint(apiUrl: string, endpoint: "query" | "close" | "cancel"): string {
	try {
		const url = new URL(apiUrl);
		url.pathname = url.pathname.replace(/\/api\/upp\/?$/, `/api/trade/${endpoint}`);
		return url.toString();
	} catch {
		return apiUrl.replace(/\/api\/upp\/?$/, `/api/trade/${endpoint}`);
	}
}

function parseTradeAmount(value: unknown): number | null {
	const amount = Number(value);
	return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function parseRefundAmount(query: Record<string, unknown>): number | null {
	return parseTradeAmount(
		query.CloseAmt ??
			query["Result[0][CloseAmt]"] ??
			query.RefundAmt ??
			query["Result[0][RefundAmt]"] ??
			query.CloseAmount ??
			query["Result[0][CloseAmount]"],
	);
}

function expectedRefundAmount(amount: number | undefined): number | null {
	if (amount === undefined) return null;
	const parsed = Number(amount);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export type PayUniCredentials = {
	merchantId: string;
	hashKey: string;
	hashIV: string;
	apiUrl: string;
};

export type FormPostResult = {
	type: "form_post";
	formData: {
		apiUrl: string;
		MerID: string;
		Version: string;
		EncryptInfo: string;
		HashInfo: string;
	};
	gatewaySessionId: string;
};

export class PayUniOneTimeGateway implements CheckoutGateway {
	readonly type = "payuni" as const;
	private service: PayUniService;

	constructor(credentials: PayUniCredentials) {
		this.service = new PayUniService(credentials);
	}

	createPaymentSession(params: {
		orderNo: string;
		amount: number;
		productTitle: string;
		customerEmail?: string;
		baseUrl: string;
	}): FormPostResult {
		const formData = this.service.createFormData({
			MerTradeNo: params.orderNo,
			TradeAmt: Math.round(params.amount),
			ProdDesc: params.productTitle.substring(0, 100),
			ReturnURL: `${params.baseUrl}/api/payuni/return`,
			NotifyURL: `${params.baseUrl}/api/payuni/notify`,
			...(params.customerEmail ? { UsrMail: params.customerEmail } : {}),
		});

		return {
			type: "form_post",
			formData: {
				apiUrl: this.service.getApiUrl(),
				MerID: formData.MerID,
				Version: formData.Version,
				EncryptInfo: formData.EncryptInfo,
				HashInfo: formData.HashInfo,
			},
			gatewaySessionId: params.orderNo,
		};
	}

	verifyNotify(encryptInfo: string, hashInfo: string) {
		return this.service.verifyAndDecrypt(encryptInfo, hashInfo);
	}

	async processRefund(params: { gatewayPaymentId: string | null; orderNo?: string; amount?: number; currency?: string }): Promise<RefundResult> {
		const tradeNo = params.gatewayPaymentId?.trim();
		if (!tradeNo) {
			return { success: false, error: "缺少 PAYUNi TradeNo，不能執行退款" };
		}

		try {
			const deadline = Date.now() + REFUND_TOTAL_TIMEOUT_MS;
			const requestOptions = (options: { version?: string } = {}) => {
				const timeoutMs = Math.min(REFUND_REQUEST_TIMEOUT_MS, deadline - Date.now());
				if (timeoutMs <= 0) throw new Error("PAYUNi 退款流程逾時");
				return { ...options, timeoutMs };
			};
			const query = await this.service.requestApi(
				tradeEndpoint(this.service.getApiUrl(), "query"),
				{ TradeNo: tradeNo },
				requestOptions({ version: "2.0" }),
			);
			if (!this.service.isTradeSuccess(String(query.Status ?? ""))) {
				return {
					success: false,
					error: `PAYUNi 交易查詢失敗：${query.Message || "未知錯誤"}（Status=${query.Status || "UNKNOWN"}）`,
				};
			}

			const closeStatus = String(query.CloseStatus ?? query["Result[0][CloseStatus]"] ?? "").trim();
			if (closeStatus === "3" || closeStatus === "9") {
				const expectedAmount = expectedRefundAmount(params.amount);
				if (expectedAmount !== null && parseRefundAmount(query) !== expectedAmount) {
					return { success: false, error: "PAYUNi 已退款金額無法確認與訂單金額一致，需人工查核" };
				}
				return { success: true };
			}

			if (closeStatus === "1") {
				const canceled = await this.service.requestApi(
					tradeEndpoint(this.service.getApiUrl(), "cancel"),
					{ TradeNo: tradeNo },
					requestOptions(),
				);
				if (!this.service.isTradeSuccess(String(canceled.Status ?? ""))) {
					return {
						success: false,
						error: `PAYUNi 取消授權失敗：${canceled.Message || "未知錯誤"}（Status=${canceled.Status || "UNKNOWN"}）`,
					};
				}
				return { success: true };
			}

			if (closeStatus === "2" || closeStatus === "7") {
				const tradeAmount = parseTradeAmount(query.TradeAmt ?? query["Result[0][TradeAmt]"]);
				if (tradeAmount === null) {
					return { success: false, error: "PAYUNi 交易查詢缺少有效 TradeAmt，不能執行退款" };
				}
				const expectedAmount = expectedRefundAmount(params.amount);
				if (expectedAmount !== null && tradeAmount !== expectedAmount) {
					return { success: false, error: "PAYUNi 交易金額與訂單退款金額不一致，不能執行退款" };
				}
				const closed = await this.service.requestApi(
					tradeEndpoint(this.service.getApiUrl(), "close"),
					{
						TradeNo: tradeNo,
						CloseType: 2,
						TradeAmt: tradeAmount,
					},
					requestOptions(),
				);
				if (!this.service.isTradeSuccess(String(closed.Status ?? ""))) {
					return {
						success: false,
						error: `PAYUNi 退款失敗：${closed.Message || "未知錯誤"}（Status=${closed.Status || "UNKNOWN"}）`,
					};
				}
				return { success: true };
			}

			return { success: false, error: `PAYUNi 回傳未支援的 CloseStatus：${closeStatus || "空值"}` };
		} catch (error) {
			return { success: false, ambiguous: true, error: error instanceof Error ? error.message : "PAYUNi 退款請求失敗" };
		}
	}

	async queryRefund(params: { gatewayPaymentId: string; orderNo?: string; amount?: number; currency?: string }): Promise<{ status: "REFUNDED" | "PENDING" | "NOT_REFUNDED" | "UNKNOWN"; error?: string }> {
		try {
			const query = await this.service.requestApi(
				tradeEndpoint(this.service.getApiUrl(), "query"),
				{ TradeNo: params.gatewayPaymentId },
				{ version: "2.0", timeoutMs: REFUND_REQUEST_TIMEOUT_MS },
			);
			if (!this.service.isTradeSuccess(String(query.Status ?? ""))) return { status: "UNKNOWN", error: query.Message || "PAYUNi 交易查詢失敗" };
			const closeStatus = String(query.CloseStatus ?? query["Result[0][CloseStatus]"] ?? "").trim();
			if (closeStatus === "3" || closeStatus === "9") {
				const expectedAmount = expectedRefundAmount(params.amount);
				if (expectedAmount !== null && parseRefundAmount(query) !== expectedAmount) {
					return { status: "UNKNOWN", error: "PAYUNi 已退款金額無法確認與訂單金額一致" };
				}
				return { status: "REFUNDED" };
			}
			if (closeStatus === "2" || closeStatus === "7" || closeStatus === "1") return { status: "NOT_REFUNDED" };
			return { status: "PENDING" };
		} catch (error) {
			return { status: "UNKNOWN", error: error instanceof Error ? error.message : "PAYUNi 交易查詢失敗" };
		}
	}
}
