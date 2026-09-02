import { createEzpayProvider } from "@paid-tw/einvoice-ezpay";

import { buildAllowanceInput } from "../../lib/invoice-issue-input";
import type { InvoiceProvider, InvoiceProviderConfig } from "../../types";
import { normalizeInvoiceQueryError } from "../invoice-query-errors";

export function createEzpayInvoiceProvider(config: InvoiceProviderConfig): InvoiceProvider {
	const provider = createEzpayProvider({
		merchantId: config.merchantId,
		hashKey: config.hashKey,
		hashIV: config.hashIV,
		mode: config.testMode ? "TEST" : "PRODUCTION",
		timeoutMs: config.timeoutMs,
		validatePayload: true,
	});

	return {
		async issue(input) {
			try {
				const result = await provider.issue(input);
				return {
					invoiceNumber: result.invoiceNumber,
					randomCode: result.randomCode,
					invoiceDate: result.invoiceDate,
					raw: result.raw,
				};
			} catch (error) {
				return { failReason: error instanceof Error ? error.message : "ezPay 開票失敗", ambiguous: true };
			}
		},
		async query(params) {
			try {
				const result = await provider.query({
					...(params.invoiceNumber ? { invoiceNumber: params.invoiceNumber } : {}),
					...(params.orderId ? { orderId: params.orderId } : {}),
					providerOptions: {
						...(params.randomCode ? { randomNum: params.randomCode } : {}),
						...(params.amount !== undefined ? { totalAmt: params.amount } : {}),
					},
				});
				return { status: String(result.status), invoiceNumber: result.invoiceNumber, invoiceDate: result.invoiceDate, randomCode: result.randomCode, raw: result.raw };
			} catch (error) {
				return normalizeInvoiceQueryError(error, "ezPay 查詢失敗");
			}
		},
		async void(params) {
			try {
				await provider.void({ invoiceNumber: params.invoiceNumber, reason: params.reason });
				return { success: true };
			} catch (error) {
				return { success: false, error: error instanceof Error ? error.message : "ezPay 作廢失敗" };
			}
		},
		async allowance(params) {
			try {
				const result = await provider.allowance(
					buildAllowanceInput({
						provider: "ezpay",
						invoiceNumber: params.invoiceNumber,
						allowanceId: params.allowanceId ?? `ALLOW-${params.invoiceNumber}`,
						originalOrderId: params.originalOrderId ?? params.invoiceNumber,
						amount: params.amount,
						itemName: params.itemName ?? "商品",
						invoiceDate: params.invoiceDate,
						buyerEmail: params.buyerEmail,
						taxExclusive: params.taxExclusive,
					}),
				);
				return { success: true, allowanceNumber: result.allowanceNumber };
			} catch (error) {
				// 折讓 catch 一律 ambiguous：逾時時供應商端可能已成功，重試會累加折讓額（與 void 冪等不同）
				return { success: false, ambiguous: true, error: error instanceof Error ? error.message : "ezPay 折讓失敗" };
			}
		},
	};
}
