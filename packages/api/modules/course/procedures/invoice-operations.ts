import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { getClientIp, recordAdminAction } from "@startkiter/platform";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";
import { normalizeProviderOrderId } from "@startkiter/payments";
import { getInvoiceProvider, isInvoiceProviderName, withInvoiceOperationLock } from "../lib/invoice-settings";
import { InvoiceAllowanceError, issueInvoiceAllowance as applyAllowance, voidInvoice as applyVoid } from "../lib/invoice-operations";

export const voidInvoice = adminProcedure
	.route({ method: "POST", path: "/course/invoices/void", tags: ["Course"], summary: "Void an invoice" })
	.input(z.object({ invoiceId: z.string().min(1) }))
	.handler(async ({ input, context }) => {
		try {
			const operation = await withInvoiceOperationLock(async (tx) => {
				const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
				if (!invoice) return null;
				if (!isInvoiceProviderName(invoice.provider)) throw new Error("發票供應商資料無效。");
				const provider = await getInvoiceProvider(invoice.provider);
				if (!provider) throw new Error("電子發票尚未完成設定，或目前設定與發票供應商不一致。");
				const result = await applyVoid({ invoice, provider });
				const updatedInvoice = await tx.invoice.update({
					where: { id: invoice.id },
					data: { status: result.status, attentionReason: null },
				});
				return { invoice: updatedInvoice, amount: invoice.amount };
			});
			if (!operation) throw new ORPCError("NOT_FOUND");
			await recordAdminAction(
				context.user.id,
				"VOID_INVOICE",
				{ type: "Invoice", id: operation.invoice.id },
				{ amount: operation.amount },
				context.session?.ipAddress ?? getClientIp(context.headers),
			);
			return { invoice: operation.invoice };
		} catch (error) {
			if (error instanceof ORPCError && error.code === "NOT_FOUND") throw error;
			throw new ORPCError("BAD_REQUEST", { message: error instanceof Error ? error.message : "作廢發票失敗。" });
		}
	});

export const issueInvoiceAllowance = adminProcedure
	.route({ method: "POST", path: "/course/invoices/allowance", tags: ["Course"], summary: "Issue an invoice allowance" })
	.input(z.object({ invoiceId: z.string().min(1), amount: z.number().int().positive() }))
	.handler(async ({ input, context }) => {
		try {
			const reservation = await withInvoiceOperationLock(async (tx) => {
				const invoice = await tx.invoice.findUnique({
					where: { id: input.invoiceId },
					include: {
						order: { select: { invoiceType: true } },
						subscription: { select: { invoiceType: true } },
					},
				});
				if (!invoice) return null;
				if (input.amount + invoice.allowanceTotal > invoice.amount) throw new Error("折讓總額不能超過發票金額。");
				if (!isInvoiceProviderName(invoice.provider)) throw new Error("發票供應商資料無效。");
				const provider = await getInvoiceProvider(invoice.provider);
				if (!provider) throw new Error("電子發票尚未完成設定，或目前設定與發票供應商不一致。");
				const allowanceId = normalizeProviderOrderId(`ALLOW-${invoice.id}-${invoice.allowanceTotal + input.amount}`, invoice.provider as "ecpay" | "ezpay");
				const existingOperation = await tx.invoiceAllowanceOperation.findUnique({ where: { allowanceId } });
				if (existingOperation?.status === "SUCCEEDED") return { completed: true as const, invoice, amount: input.amount, allowanceId, provider, sourceInvoiceType: invoice.order?.invoiceType ?? invoice.subscription?.invoiceType };
				if (existingOperation?.status === "PENDING" || existingOperation?.status === "UNKNOWN") {
					throw new Error("這筆折讓已有待確認的供應商作業，請先查核供應商結果，禁止重送。");
				}
				if (existingOperation) {
					await tx.invoiceAllowanceOperation.update({
						where: { id: existingOperation.id },
						data: { status: "PENDING", errorMessage: null, allowanceNumber: null },
					});
				} else {
					await tx.invoiceAllowanceOperation.create({
						data: { invoiceId: invoice.id, allowanceId, provider: invoice.provider, amount: input.amount },
					});
				}
				const sourceInvoiceType = invoice.order?.invoiceType ?? invoice.subscription?.invoiceType;
				return { completed: false as const, invoice, amount: input.amount, allowanceId, provider, sourceInvoiceType };
			});
			if (!reservation) throw new ORPCError("NOT_FOUND");
			if (reservation.completed) {
				await recordAdminAction(
					context.user.id,
					"ALLOWANCE_INVOICE",
					{ type: "Invoice", id: reservation.invoice.id },
					{ amount: reservation.amount },
					context.session?.ipAddress ?? getClientIp(context.headers),
				);
				return { invoice: reservation.invoice };
			}

			let result: Awaited<ReturnType<typeof applyAllowance>>;
			try {
				result = await applyAllowance({
					invoice: {
						...reservation.invoice,
						taxExclusive: reservation.invoice.provider === "ezpay" && reservation.sourceInvoiceType === "COMPANY",
					},
					provider: reservation.provider,
					amount: input.amount,
					allowanceId: reservation.allowanceId,
				});
			} catch (error) {
				await withInvoiceOperationLock(async (tx) => {
					await tx.invoiceAllowanceOperation.update({
						where: { allowanceId: reservation.allowanceId },
						data: {
							status: error instanceof InvoiceAllowanceError && !error.ambiguous ? "FAILED" : "UNKNOWN",
							errorMessage: error instanceof Error ? error.message : "開立折讓失敗",
						},
					});
				});
				throw error;
			}

			const operation = await withInvoiceOperationLock(async (tx) => {
				const updatedInvoice = await tx.invoice.update({
					where: { id: reservation.invoice.id },
					data: { status: result.status, allowanceTotal: { increment: input.amount } },
				});
				await tx.invoiceAllowanceOperation.update({
					where: { allowanceId: reservation.allowanceId },
					data: { status: "SUCCEEDED", allowanceNumber: result.allowanceNumber, errorMessage: null },
				});
				return { invoice: updatedInvoice, amount: input.amount };
			});
			if (!operation) throw new ORPCError("NOT_FOUND");
			await recordAdminAction(
				context.user.id,
				"ALLOWANCE_INVOICE",
				{ type: "Invoice", id: operation.invoice.id },
				{ amount: operation.amount },
				context.session?.ipAddress ?? getClientIp(context.headers),
			);
			return { invoice: operation.invoice };
		} catch (error) {
			if (error instanceof ORPCError && error.code === "NOT_FOUND") throw error;
			throw new ORPCError("BAD_REQUEST", { message: error instanceof Error ? error.message : "開立折讓失敗。" });
		}
	});
