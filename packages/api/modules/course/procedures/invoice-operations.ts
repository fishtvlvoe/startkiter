import { ORPCError } from "@orpc/server";
import { randomUUID } from "node:crypto";
import { getClientIp, recordAdminAction } from "@startkiter/platform";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";
import { assertInvoiceVoidable, voidInvoice as applyVoid } from "../lib/invoice-operations";
import { InvoiceOperationNotFoundError, runInvoiceAllowanceOperation } from "../lib/run-invoice-allowance-operation";
import {
	getInvoiceProvider,
	INVOICE_OPERATION_LEASE_MS,
	isInvoiceProviderName,
	withInvoiceOperationLock,
} from "../lib/invoice-settings";

function isStaleOperation(startedAt: Date | null): boolean {
	return !startedAt || Date.now() - startedAt.getTime() >= INVOICE_OPERATION_LEASE_MS;
}

export const voidInvoice = adminProcedure
	.route({ method: "POST", path: "/course/invoices/void", tags: ["Course"], summary: "Void an invoice" })
	.input(z.object({ invoiceId: z.string().min(1) }))
	.handler(async ({ input, context }) => {
		try {
			const reservation = await withInvoiceOperationLock(async (tx) => {
				const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
				if (!invoice) return null;
				if (!isInvoiceProviderName(invoice.provider)) throw new Error("發票供應商資料無效。");
				const reclaim = invoice.attentionReason === "VOID_IN_PROGRESS" && isStaleOperation(invoice.operationStartedAt);
				assertInvoiceVoidable(reclaim ? { ...invoice, attentionReason: null } : invoice);
				const operationToken = randomUUID();
				const claimed = await tx.invoice.updateMany({
					where: reclaim
						? { id: invoice.id, status: "ISSUED", attentionReason: "VOID_IN_PROGRESS", OR: [{ operationStartedAt: null }, { operationStartedAt: { lt: new Date(Date.now() - INVOICE_OPERATION_LEASE_MS) } }] }
						: { id: invoice.id, status: "ISSUED", attentionReason: null },
					data: { attentionReason: "VOID_IN_PROGRESS", operationToken, operationStartedAt: new Date(), failReason: null },
				});
				if (claimed.count !== 1) throw new Error("發票目前有待確認的作業，請先完成查核");
				return { invoice, amount: invoice.amount, operationToken, reclaim };
			});
			if (!reservation) throw new ORPCError("NOT_FOUND");
			const provider = await getInvoiceProvider(reservation.invoice.provider as "ecpay" | "ezpay");
			if (!provider) {
				await withInvoiceOperationLock(async (tx) => {
					await tx.invoice.updateMany({
						where: { id: reservation.invoice.id, status: "ISSUED", attentionReason: "VOID_IN_PROGRESS", operationToken: reservation.operationToken },
						data: { attentionReason: "VOID_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: "電子發票尚未完成設定，或目前設定與發票供應商不一致。" },
					});
				});
				throw new Error("電子發票尚未完成設定，或目前設定與發票供應商不一致。");
			}
			const markNeedsReview = async (reason: string) => {
				await withInvoiceOperationLock(async (tx) => {
					await tx.invoice.updateMany({
						where: { id: reservation.invoice.id, status: "ISSUED", attentionReason: "VOID_IN_PROGRESS", operationToken: reservation.operationToken },
						data: { attentionReason: "VOID_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: reason },
					});
				});
			};
			if (reservation.reclaim) {
				if (!provider.query) {
					await markNeedsReview("作廢結果待查，provider 不支援查詢");
					throw new Error("作廢結果待查，provider 不支援查詢");
				}
				const queried = await provider.query({ invoiceNumber: reservation.invoice.invoiceNumber!, invoiceDate: reservation.invoice.invoiceDate });
				if (queried.status === "VOIDED") {
					const recovered = await withInvoiceOperationLock(async (tx) => {
						const updated = await tx.invoice.updateMany({
							where: { id: reservation.invoice.id, status: "ISSUED", attentionReason: "VOID_IN_PROGRESS", operationToken: reservation.operationToken },
							data: { status: "VOIDED", attentionReason: null, operationToken: null, operationStartedAt: null, failReason: null },
						});
						if (updated.count !== 1) return null;
						const invoice = await tx.invoice.findUnique({ where: { id: reservation.invoice.id } });
						return invoice ? { invoice, amount: reservation.amount } : null;
					});
					if (!recovered) throw new Error("作廢結果無法安全寫回，請查核供應商結果。");
					await recordAdminAction(context.user.id, "VOID_INVOICE", { type: "Invoice", id: recovered.invoice.id }, { amount: recovered.amount }, context.session?.ipAddress ?? getClientIp(context.headers));
					return { invoice: recovered.invoice };
				}
				if (queried.status !== "ISSUED") {
					const reason = queried.error ?? "作廢結果待查";
					await markNeedsReview(reason);
					throw new Error(reason);
				}
			}
			let result: Awaited<ReturnType<typeof applyVoid>>;
			try {
					result = await applyVoid({ invoice: { ...reservation.invoice, attentionReason: null }, provider });
			} catch (error) {
					await withInvoiceOperationLock(async (tx) => {
						await tx.invoice.updateMany({
							where: { id: reservation.invoice.id, status: "ISSUED", attentionReason: "VOID_IN_PROGRESS", operationToken: reservation.operationToken },
							data: { attentionReason: "VOID_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: error instanceof Error ? error.message : "作廢結果待查" },
					});
				});
				throw error;
			}
				const operation = await withInvoiceOperationLock(async (tx) => {
					const updated = await tx.invoice.updateMany({
						where: { id: reservation.invoice.id, status: "ISSUED", attentionReason: "VOID_IN_PROGRESS", operationToken: reservation.operationToken },
						data: { status: result.status, attentionReason: null, operationToken: null, operationStartedAt: null, failReason: null },
				});
				if (updated.count !== 1) return null;
				const invoice = await tx.invoice.findUnique({ where: { id: reservation.invoice.id } });
				return invoice ? { invoice, amount: reservation.amount } : null;
			});
			if (!operation) throw new Error("作廢結果無法安全寫回，請查核供應商結果。");
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

export const resolveInvoiceReview = adminProcedure
	.route({ method: "POST", path: "/course/invoices/resolve-review", tags: ["Course"], summary: "Resolve an invoice stuck in *_NEEDS_REVIEW" })
	.input(
		z.object({
			invoiceId: z.string().min(1),
			attentionReason: z.enum(["ALLOWANCE_NEEDS_REVIEW", "VOID_NEEDS_REVIEW"]),
			outcome: z.enum(["SUCCEEDED", "FAILED"]),
			allowanceNumber: z.string().min(1).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		try {
			const result = await withInvoiceOperationLock(async (tx) => {
				if (input.attentionReason === "VOID_NEEDS_REVIEW") {
					const updated = await tx.invoice.updateMany({
						where: { id: input.invoiceId, attentionReason: "VOID_NEEDS_REVIEW" },
						data:
							input.outcome === "SUCCEEDED"
								? { status: "VOIDED", attentionReason: null, failReason: null }
								: { attentionReason: null, failReason: null },
					});
					if (updated.count !== 1) throw new Error("發票目前不是待確認狀態，可能已被處理過");
					const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
					if (!invoice) throw new ORPCError("NOT_FOUND");
					return { invoice, operationAmount: input.outcome === "SUCCEEDED" ? invoice.amount : null, allowanceNumber: null as string | null };
				}

				const operation = await tx.invoiceAllowanceOperation.findFirst({
					where: { invoiceId: input.invoiceId, status: "UNKNOWN" },
					orderBy: { createdAt: "desc" },
				});
				if (input.outcome === "SUCCEEDED" && !operation) {
					throw new Error("找不到待確認的折讓紀錄，無法標記為已完成");
				}

				const updated = await tx.invoice.updateMany({
					where: { id: input.invoiceId, attentionReason: "ALLOWANCE_NEEDS_REVIEW" },
					data:
						input.outcome === "SUCCEEDED" && operation
							? { status: "ALLOWANCE", allowanceTotal: { increment: operation.amount }, attentionReason: null, failReason: null }
							: { attentionReason: null, failReason: null },
				});
				if (updated.count !== 1) throw new Error("發票目前不是待確認狀態，可能已被處理過");

				if (operation) {
					await tx.invoiceAllowanceOperation.update({
						where: { allowanceId: operation.allowanceId },
						data:
							input.outcome === "SUCCEEDED"
								? { status: "SUCCEEDED", allowanceNumber: input.allowanceNumber ?? null }
								: { status: "FAILED" },
					});
				}

				const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
				if (!invoice) throw new ORPCError("NOT_FOUND");
				return {
					invoice,
					operationAmount: operation?.amount ?? null,
					allowanceNumber: input.outcome === "SUCCEEDED" ? (input.allowanceNumber ?? null) : null,
				};
			});
			await recordAdminAction(
				context.user.id,
				"RESOLVE_INVOICE_REVIEW",
				{ type: "Invoice", id: result.invoice.id },
				{
					attentionReason: input.attentionReason,
					outcome: input.outcome,
					amount: result.operationAmount,
					allowanceNumber: result.allowanceNumber,
				},
				context.session?.ipAddress ?? getClientIp(context.headers),
			);
			return { invoice: result.invoice };
		} catch (error) {
			if (error instanceof ORPCError && error.code === "NOT_FOUND") throw error;
			throw new ORPCError("BAD_REQUEST", { message: error instanceof Error ? error.message : "處理待確認發票失敗。" });
		}
	});

export const issueInvoiceAllowance = adminProcedure
	.route({ method: "POST", path: "/course/invoices/allowance", tags: ["Course"], summary: "Issue an invoice allowance" })
	.input(z.object({ invoiceId: z.string().min(1), amount: z.number().int().positive() }))
	.handler(async ({ input, context }) => {
		try {
			const operation = await runInvoiceAllowanceOperation({
				invoiceId: input.invoiceId,
				amount: input.amount,
				definiteFailureAttentionReason: null,
			});
			await recordAdminAction(
				context.user.id,
				"ALLOWANCE_INVOICE",
				{ type: "Invoice", id: operation.invoice.id },
				{ amount: operation.amount },
				context.session?.ipAddress ?? getClientIp(context.headers),
			);
			return { invoice: operation.invoice };
		} catch (error) {
			if (error instanceof InvoiceOperationNotFoundError) throw new ORPCError("NOT_FOUND");
			if (error instanceof ORPCError && error.code === "NOT_FOUND") throw error;
			throw new ORPCError("BAD_REQUEST", { message: error instanceof Error ? error.message : "開立折讓失敗。" });
		}
	});
