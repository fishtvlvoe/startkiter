import { createEcpayProvider } from "@paid-tw/einvoice-ecpay";

import { buildAllowanceInput } from "../../lib/invoice-issue-input";
import type { InvoiceProvider, InvoiceProviderConfig } from "../../types";
import { normalizeInvoiceQueryError } from "../invoice-query-errors";

export function createEcpayInvoiceProvider(config: InvoiceProviderConfig): InvoiceProvider {
	const provider = createEcpayProvider({
		merchantId: config.merchantId,
		hashKey: config.hashKey,
		hashIV: config.hashIV,
		mode: config.testMode ? "TEST" : "PRODUCTION",
		timeoutMs: config.timeoutMs,
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
				return { failReason: error instanceof Error ? error.message : "ECPay 開票失敗", ambiguous: true };
			}
		},
		async query(params) {
			try {
				const result = await provider.query({
					...(params.invoiceNumber ? { invoiceNumber: params.invoiceNumber } : {}),
					...(params.orderId ? { orderId: params.orderId } : {}),
					providerOptions: {
						...(params.invoiceDate ? { invoiceDate: params.invoiceDate } : {}),
					},
				});
				return { status: String(result.status), invoiceNumber: result.invoiceNumber, invoiceDate: result.invoiceDate, randomCode: result.randomCode, raw: result.raw };
			} catch (error) {
				return normalizeInvoiceQueryError(error, "ECPay 查詢失敗");
			}
		},
		async queryAllowance(params) {
			try {
				const date = params.invoiceDate ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(params.invoiceDate) : undefined;
				const rows = await provider.getAllowanceList({ allowanceNumber: params.allowanceId, ...(date ? { date, dateType: "ISSUE" } : {}) });
				const row = rows.find((item) => item.invoiceNumber === params.invoiceNumber || item.allowanceNumber === params.allowanceId);
				return row && !row.voided ? { status: "SUCCEEDED", allowanceNumber: row.allowanceNumber } : { status: "NOT_FOUND" };
			} catch (error) {
				return { status: "UNKNOWN", error: error instanceof Error ? error.message : "ECPay 折讓查詢失敗" };
			}
		},
		async void(params) {
			try {
				await provider.void({
					invoiceNumber: params.invoiceNumber,
					reason: params.reason,
					date: params.invoiceDate ?? undefined,
				});
				return { success: true };
			} catch (error) {
				return { success: false, error: error instanceof Error ? error.message : "ECPay 作廢失敗" };
			}
		},
		async allowance(params) {
			try {
				const result = await provider.allowance(
					buildAllowanceInput({
						provider: "ecpay",
						invoiceNumber: params.invoiceNumber,
						allowanceId: params.allowanceId ?? `ALLOW-${params.invoiceNumber}`,
						originalOrderId: params.originalOrderId ?? params.invoiceNumber,
						amount: params.amount,
						itemName: params.itemName ?? "商品",
						invoiceDate: params.invoiceDate,
					}),
				);
				return { success: true, allowanceNumber: result.allowanceNumber };
			} catch (error) {
				return { success: false, ambiguous: true, error: error instanceof Error ? error.message : "ECPay 折讓失敗" };
			}
		},
	};
}
