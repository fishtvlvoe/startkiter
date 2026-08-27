import { InvoiceError, InvoiceErrorCode } from "@paid-tw/einvoice";
import { describe, expect, it } from "vitest";

import { normalizeInvoiceQueryError } from "./invoice-query-errors";

describe("invoice query error normalization", () => {
	it("preserves a provider NOT_FOUND as a retryable absence", () => {
		const error = new InvoiceError("查無發票", { provider: "ezpay", code: InvoiceErrorCode.NOT_FOUND });
		expect(normalizeInvoiceQueryError(error, "查詢失敗")).toEqual({ status: "NOT_FOUND", error: "查無發票" });
	});

	it("keeps transport errors unknown", () => {
		expect(normalizeInvoiceQueryError(new Error("timeout"), "查詢失敗")).toEqual({ status: "UNKNOWN", error: "timeout" });
	});
});
