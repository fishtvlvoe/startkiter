import { createEzpayProvider } from "@paid-tw/einvoice-ezpay";

import { buildAllowanceInput } from "../../lib/invoice-issue-input";
import type { InvoiceProvider, InvoiceProviderConfig } from "../../types";

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
				return { failReason: error instanceof Error ? error.message : "ezPay 開票失敗" };
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
				return { success: false, ambiguous: true, error: error instanceof Error ? error.message : "ezPay 折讓失敗" };
			}
		},
	};
}
