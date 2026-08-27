import { InvoiceErrorCode, isInvoiceError } from "@paid-tw/einvoice";

export function normalizeInvoiceQueryError(error: unknown, fallback: string): { status: "NOT_FOUND" | "UNKNOWN"; error: string } {
	if (isInvoiceError(error) && error.code === InvoiceErrorCode.NOT_FOUND) {
		return { status: "NOT_FOUND", error: error.message };
	}
	return { status: "UNKNOWN", error: error instanceof Error ? error.message : fallback };
}
