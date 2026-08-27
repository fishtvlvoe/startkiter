import { ORPCError } from "@orpc/server";
import { randomUUID } from "node:crypto";
import { db } from "@startkiter/database";
import { getClientIp, recordAdminAction } from "@startkiter/platform";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";
import { normalizeProviderOrderId } from "@startkiter/payments";
import { getInvoiceProvider, isInvoiceProviderName, withInvoiceOperationLock } from "../lib/invoice-settings";
import { InvoiceAllowanceError, assertInvoiceVoidable, issueInvoiceAllowance as applyAllowance, voidInvoice as applyVoid } from "../lib/invoice-operations";

const OPERATION_LEASE_MS = 60_000;

function isStaleOperation(startedAt: Date | null): boolean {
	return !startedAt || Date.now() - startedAt.getTime() >= OPERATION_LEASE_MS;
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
						? { id: invoice.id, status: "ISSUED", attentionReason: "VOID_IN_PROGRESS", OR: [{ operationStartedAt: null }, { operationStartedAt: { lt: new Date(Date.now() - OPERATION_LEASE_MS) } }] }
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
				const allowanceId = normalizeProviderOrderId(`ALLOW-${invoice.id}-${invoice.allowanceTotal + input.amount}`, invoice.provider as "ecpay" | "ezpay");
				const existingOperation = await tx.invoiceAllowanceOperation.findUnique({ where: { allowanceId } });
				if (existingOperation?.status === "SUCCEEDED") return { completed: true as const, invoice, amount: input.amount, allowanceId, sourceInvoiceType: invoice.order?.invoiceType ?? invoice.subscription?.invoiceType };
				const reclaim = existingOperation?.status === "PENDING" && isStaleOperation(invoice.operationStartedAt);
				if (existingOperation?.status === "PENDING" && !reclaim) {
					throw new Error("這筆折讓已有待確認的供應商作業，請先查核供應商結果，禁止重送。");
				}
				if (existingOperation?.status === "UNKNOWN") throw new Error("這筆折讓已有待確認的供應商作業，請先查核供應商結果，禁止重送。");
				if (invoice.attentionReason && invoice.attentionReason !== "REFUND_NEEDS_ALLOWANCE") {
					if (!(invoice.attentionReason === "ALLOWANCE_IN_PROGRESS" && reclaim)) {
					throw new Error("發票目前有待確認的作業，請先完成查核");
					}
				}
				const operationToken = randomUUID();
				const claimed = await tx.invoice.updateMany({
					where: reclaim
						? { id: invoice.id, status: { in: ["ISSUED", "ALLOWANCE"] }, attentionReason: "ALLOWANCE_IN_PROGRESS", OR: [{ operationStartedAt: null }, { operationStartedAt: { lt: new Date(Date.now() - OPERATION_LEASE_MS) } }] }
						: { id: invoice.id, status: { in: ["ISSUED", "ALLOWANCE"] }, attentionReason: invoice.attentionReason },
					data: { attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken, operationStartedAt: new Date(), failReason: null },
				});
				if (claimed.count !== 1) throw new Error("發票目前有待確認的作業，請先完成查核");
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
				return { completed: false as const, invoice, amount: input.amount, allowanceId, sourceInvoiceType, operationToken, reclaim };
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

			const provider = await getInvoiceProvider(reservation.invoice.provider as "ecpay" | "ezpay");
			if (!provider) {
				await withInvoiceOperationLock(async (tx) => {
					await tx.invoiceAllowanceOperation.update({
						where: { allowanceId: reservation.allowanceId },
						data: { status: "UNKNOWN", errorMessage: "電子發票尚未完成設定，或目前設定與發票供應商不一致。" },
					});
						await tx.invoice.updateMany({
							where: { id: reservation.invoice.id, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: reservation.operationToken },
							data: { attentionReason: "ALLOWANCE_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: "電子發票尚未完成設定，或目前設定與發票供應商不一致。" },
					});
				});
				throw new Error("電子發票尚未完成設定，或目前設定與發票供應商不一致。");
			}
			if (reservation.reclaim) {
				if (!provider.queryAllowance) {
					await withInvoiceOperationLock(async (tx) => {
						await tx.invoiceAllowanceOperation.update({ where: { allowanceId: reservation.allowanceId }, data: { status: "UNKNOWN", errorMessage: "折讓結果待查，provider 不支援折讓查詢" } });
						await tx.invoice.updateMany({ where: { id: reservation.invoice.id, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: reservation.operationToken }, data: { attentionReason: "ALLOWANCE_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: "折讓結果待查，provider 不支援折讓查詢" } });
					});
					throw new Error("折讓結果待查，provider 不支援折讓查詢");
				}
				const queried = await provider.queryAllowance({ invoiceNumber: reservation.invoice.invoiceNumber!, allowanceId: reservation.allowanceId, invoiceDate: reservation.invoice.invoiceDate });
				if (queried.status === "SUCCEEDED") {
					const recovered = await withInvoiceOperationLock(async (tx) => {
						const updated = await tx.invoice.updateMany({ where: { id: reservation.invoice.id, status: { in: ["ISSUED", "ALLOWANCE"] }, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: reservation.operationToken }, data: { status: "ALLOWANCE", allowanceTotal: { increment: reservation.amount }, attentionReason: null, operationToken: null, operationStartedAt: null, failReason: null } });
						if (updated.count !== 1) return null;
						await tx.invoiceAllowanceOperation.update({ where: { allowanceId: reservation.allowanceId }, data: { status: "SUCCEEDED", allowanceNumber: queried.allowanceNumber, errorMessage: null } });
						const invoice = await tx.invoice.findUnique({ where: { id: reservation.invoice.id } });
						return invoice ? { invoice, amount: reservation.amount } : null;
					});
					if (!recovered) throw new Error("折讓結果無法安全寫回，請查核供應商結果。");
					await recordAdminAction(context.user.id, "ALLOWANCE_INVOICE", { type: "Invoice", id: recovered.invoice.id }, { amount: recovered.amount }, context.session?.ipAddress ?? getClientIp(context.headers));
					return { invoice: recovered.invoice };
				}
				const reason = queried.error ?? "折讓結果待查";
				await withInvoiceOperationLock(async (tx) => {
					await tx.invoiceAllowanceOperation.update({ where: { allowanceId: reservation.allowanceId }, data: { status: "UNKNOWN", errorMessage: reason } });
					await tx.invoice.updateMany({ where: { id: reservation.invoice.id, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: reservation.operationToken }, data: { attentionReason: "ALLOWANCE_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: reason } });
				});
				throw new Error(reason);
			}
			let result: Awaited<ReturnType<typeof applyAllowance>>;
			try {
				result = await applyAllowance({
					invoice: {
						...reservation.invoice,
						taxExclusive: reservation.invoice.provider === "ezpay" && reservation.sourceInvoiceType === "COMPANY",
					},
					provider,
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
						await tx.invoice.updateMany({
							where: { id: reservation.invoice.id, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: reservation.operationToken },
							data: {
								attentionReason: error instanceof InvoiceAllowanceError && error.ambiguous ? "ALLOWANCE_NEEDS_REVIEW" : null,
								operationToken: null,
								operationStartedAt: null,
							failReason: error instanceof Error ? error.message : "開立折讓失敗",
						},
					});
				});
				throw error;
			}

				const operation = await withInvoiceOperationLock(async (tx) => {
					const updated = await tx.invoice.updateMany({
						where: { id: reservation.invoice.id, status: { in: ["ISSUED", "ALLOWANCE"] }, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: reservation.operationToken },
						data: { status: result.status, allowanceTotal: { increment: input.amount }, attentionReason: null, operationToken: null, operationStartedAt: null, failReason: null },
				});
				if (updated.count !== 1) {
					await tx.invoiceAllowanceOperation.update({
						where: { allowanceId: reservation.allowanceId },
						data: { status: "UNKNOWN", errorMessage: "折讓成功但本地發票狀態無法安全寫回" },
					});
					return null;
				}
				await tx.invoiceAllowanceOperation.update({
					where: { allowanceId: reservation.allowanceId },
					data: { status: "SUCCEEDED", allowanceNumber: result.allowanceNumber, errorMessage: null },
				});
				const updatedInvoice = await tx.invoice.findUnique({ where: { id: reservation.invoice.id } });
				return updatedInvoice ? { invoice: updatedInvoice, amount: input.amount } : null;
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
