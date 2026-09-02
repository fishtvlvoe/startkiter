import type { InvoiceProvider } from "@startkiter/payments";
import { sameTaiwanBillingMonth } from "./taiwan-billing-month";

type InvoiceForOperation = {
	id: string;
	status: "ISSUED" | "VOIDED" | "ALLOWANCE" | string;
	invoiceNumber: string | null;
	invoiceDate: Date | null;
	allowanceTotal: number;
	attentionReason?: string | null;
	taxExclusive?: boolean;
};

export function assertInvoiceVoidable(invoice: InvoiceForOperation, now = new Date()): void {
	if (invoice.status !== "ISSUED" || !invoice.invoiceNumber) throw new Error("只有已開立且有發票號碼的發票可以作廢");
	if (invoice.attentionReason) throw new Error("發票目前有待確認的作業，請先完成查核");
	if (!invoice.invoiceDate || !sameTaiwanBillingMonth(invoice.invoiceDate, now)) {
		throw new Error("發票已跨月，請改用折讓");
	}
}

export class InvoiceAllowanceError extends Error {
	constructor(message: string, readonly ambiguous: boolean) {
		super(message);
		this.name = "InvoiceAllowanceError";
	}
}

export async function voidInvoice(args: {
	invoice: InvoiceForOperation;
	provider: Pick<InvoiceProvider, "void">;
	now?: Date;
}): Promise<InvoiceForOperation & { status: "VOIDED" }> {
	const invoice = args.invoice;
	assertInvoiceVoidable(invoice, args.now);

	const result = await args.provider.void({ invoiceNumber: invoice.invoiceNumber!, reason: "退款", invoiceDate: invoice.invoiceDate! });
	if (!result.success) throw new Error(result.error ?? "作廢發票失敗");
	return { ...invoice, status: "VOIDED" };
}

export async function issueInvoiceAllowance(args: {
	invoice: InvoiceForOperation;
	provider: Pick<InvoiceProvider, "allowance">;
	amount: number;
	allowanceId?: string;
}): Promise<InvoiceForOperation & { status: "ALLOWANCE"; allowanceNumber?: string }> {
	const invoice = args.invoice;
	if (invoice.status !== "ISSUED" && invoice.status !== "ALLOWANCE") throw new Error("只有已開立的發票可以開立折讓");
	if (!Number.isSafeInteger(args.amount) || args.amount <= 0) throw new Error("折讓金額必須是正整數");
	if (!invoice.invoiceNumber) throw new Error("發票缺少發票號碼");

	const result = await (async () => {
		try {
			return await args.provider.allowance({
				invoiceNumber: invoice.invoiceNumber!,
				amount: args.amount,
				allowanceId: args.allowanceId,
				invoiceDate: invoice.invoiceDate,
				taxExclusive: invoice.taxExclusive,
			});
		} catch (error) {
			// provider 拋錯（含逾時）= 結果不明；不可當明確失敗，否則 FAILED 可被重試造成雙重折讓
			throw new InvoiceAllowanceError(
				error instanceof Error ? error.message : "開立折讓失敗",
				true,
			);
		}
	})();
	if (!result.success) throw new InvoiceAllowanceError(result.error ?? "開立折讓失敗", result.ambiguous === true);
	return {
		...invoice,
		status: "ALLOWANCE",
		allowanceTotal: invoice.allowanceTotal + args.amount,
		allowanceNumber: result.allowanceNumber,
	};
}
