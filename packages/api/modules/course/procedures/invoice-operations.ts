import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";
import { getInvoiceProvider } from "../lib/invoice-settings";
import { issueInvoiceAllowance as applyAllowance, voidInvoice as applyVoid } from "../lib/invoice-operations";

export const voidInvoice = adminProcedure
	.route({ method: "POST", path: "/course/invoices/void", tags: ["Course"], summary: "Void an invoice" })
	.input(z.object({ invoiceId: z.string().min(1) }))
	.handler(async ({ input }) => {
		const invoice = await db.invoice.findUnique({ where: { id: input.invoiceId } });
		if (!invoice) throw new ORPCError("NOT_FOUND");
		const provider = await getInvoiceProvider();
		if (!provider) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "電子發票尚未完成設定。" });

		try {
			const result = await applyVoid({ invoice, provider });
			return {
				invoice: await db.invoice.update({
					where: { id: invoice.id },
					data: { status: result.status, attentionReason: null },
				}),
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", { message: error instanceof Error ? error.message : "作廢發票失敗。" });
		}
	});

export const issueInvoiceAllowance = adminProcedure
	.route({ method: "POST", path: "/course/invoices/allowance", tags: ["Course"], summary: "Issue an invoice allowance" })
	.input(z.object({ invoiceId: z.string().min(1), amount: z.number().int().positive() }))
	.handler(async ({ input }) => {
		const invoice = await db.invoice.findUnique({ where: { id: input.invoiceId } });
		if (!invoice) throw new ORPCError("NOT_FOUND");
		if (input.amount + invoice.allowanceTotal > invoice.amount) {
			throw new ORPCError("BAD_REQUEST", { message: "折讓總額不能超過發票金額。" });
		}
		const provider = await getInvoiceProvider();
		if (!provider) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "電子發票尚未完成設定。" });

		try {
			const result = await applyAllowance({ invoice, provider, amount: input.amount, allowanceId: `ALLOW-${invoice.id}-${Date.now()}` });
			return {
				invoice: await db.invoice.update({
					where: { id: invoice.id },
					data: { status: result.status, allowanceTotal: result.allowanceTotal },
				}),
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", { message: error instanceof Error ? error.message : "開立折讓失敗。" });
		}
	});
