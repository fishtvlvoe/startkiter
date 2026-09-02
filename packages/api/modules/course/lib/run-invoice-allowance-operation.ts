import { randomUUID } from "node:crypto";

import { normalizeProviderOrderId } from "@startkiter/payments";
import type { Prisma } from "@startkiter/database";

import { InvoiceAllowanceError, issueInvoiceAllowance as applyAllowance } from "./invoice-operations";
import {
	getInvoiceProvider,
	INVOICE_OPERATION_LEASE_MS,
	isInvoiceProviderName,
	withInvoiceOperationLock,
} from "./invoice-settings";

/** 找不到目標發票或折讓作業。呼叫端用 `instanceof` 判斷，不要比對錯誤訊息字串。 */
export class InvoiceOperationNotFoundError extends Error {
	constructor(message = "找不到指定的發票或折讓作業") {
		super(message);
		this.name = "InvoiceOperationNotFoundError";
	}
}

type InvoiceWithSource = Prisma.InvoiceGetPayload<{
	include: {
		order: { select: { invoiceType: true } };
		subscription: { select: { invoiceType: true } };
	};
}>;

export type RunInvoiceAllowanceOperationArgs = {
	invoiceId: string;
	amount: number;
	/**
	 * 明確失敗時寫回的 attentionReason。
	 * admin 手動折讓傳 null（維持現行行為）；跨月自動折讓傳 REFUND_NEEDS_ALLOWANCE。
	 */
	definiteFailureAttentionReason?: string | null;
	/**
	 * 系統自動觸發標記；成功後寫入 InvoiceAllowanceOperation.errorMessage 供稽核追溯。
	 * admin 手動不傳。
	 */
	systemTrigger?: string | null;
	/**
	 * 退款流程已在 reserve 佔好 ALLOWANCE_IN_PROGRESS 租約時傳入，避免與 admin 搶中間空窗。
	 */
	resumeOperationToken?: string | null;
};

export type RunInvoiceAllowanceOperationResult = {
	invoice: Prisma.InvoiceGetPayload<{}>;
	amount: number;
	alreadyCompleted: boolean;
};

function isStaleOperation(startedAt: Date | null): boolean {
	return !startedAt || Date.now() - startedAt.getTime() >= INVOICE_OPERATION_LEASE_MS;
}

function systemTriggerMarker(trigger: string): string {
	return `[trigger:system:${trigger}]`;
}

/**
 * 折讓作業核心：含全部併發／冪等保護。
 * admin procedure 與跨月退款自動折讓共用，禁止另複製一套。
 */
export async function runInvoiceAllowanceOperation(
	args: RunInvoiceAllowanceOperationArgs,
): Promise<RunInvoiceAllowanceOperationResult> {
	const definiteFailureAttentionReason = args.definiteFailureAttentionReason ?? null;
	const systemTrigger = args.systemTrigger ?? null;
	const resumeOperationToken = args.resumeOperationToken ?? null;

	const reservation = await withInvoiceOperationLock(async (tx) => {
		const invoice = await tx.invoice.findUnique({
			where: { id: args.invoiceId },
			include: {
				order: { select: { invoiceType: true } },
				subscription: { select: { invoiceType: true } },
			},
		});
		if (!invoice) return null;
		if (args.amount + invoice.allowanceTotal > invoice.amount) throw new Error("折讓總額不能超過發票金額。");
		if (!isInvoiceProviderName(invoice.provider)) throw new Error("發票供應商資料無效。");
		const allowanceId = normalizeProviderOrderId(
			`ALLOW-${invoice.id}-${invoice.allowanceTotal + args.amount}`,
			invoice.provider as "ecpay" | "ezpay",
		);
		const existingOperation = await tx.invoiceAllowanceOperation.findUnique({ where: { allowanceId } });
		if (existingOperation?.status === "SUCCEEDED") {
			return {
				completed: true as const,
				invoice,
				amount: args.amount,
				allowanceId,
				sourceInvoiceType: invoice.order?.invoiceType ?? invoice.subscription?.invoiceType,
			};
		}

		if (resumeOperationToken) {
			if (
				invoice.attentionReason !== "ALLOWANCE_IN_PROGRESS" ||
				invoice.operationToken !== resumeOperationToken
			) {
				throw new Error("發票目前有待確認的作業，請先完成查核");
			}
			if (existingOperation?.status === "PENDING") {
				await tx.invoiceAllowanceOperation.update({
					where: { id: existingOperation.id },
					data: { status: "PENDING", errorMessage: systemTrigger ? systemTriggerMarker(systemTrigger) : null, allowanceNumber: null },
				});
			} else if (!existingOperation) {
				await tx.invoiceAllowanceOperation.create({
					data: {
						invoiceId: invoice.id,
						allowanceId,
						provider: invoice.provider,
						amount: args.amount,
						errorMessage: systemTrigger ? systemTriggerMarker(systemTrigger) : null,
					},
				});
			} else if (existingOperation.status === "UNKNOWN") {
				throw new Error("這筆折讓已有待確認的供應商作業，請先查核供應商結果，禁止重送。");
			}
			return {
				completed: false as const,
				invoice,
				amount: args.amount,
				allowanceId,
				sourceInvoiceType: invoice.order?.invoiceType ?? invoice.subscription?.invoiceType,
				operationToken: resumeOperationToken,
				reclaim: false,
			};
		}

		const reclaim = existingOperation?.status === "PENDING" && isStaleOperation(invoice.operationStartedAt);
		if (existingOperation?.status === "PENDING" && !reclaim) {
			throw new Error("這筆折讓已有待確認的供應商作業，請先查核供應商結果，禁止重送。");
		}
		if (existingOperation?.status === "UNKNOWN") {
			throw new Error("這筆折讓已有待確認的供應商作業，請先查核供應商結果，禁止重送。");
		}
		if (invoice.attentionReason && invoice.attentionReason !== "REFUND_NEEDS_ALLOWANCE") {
			if (!(invoice.attentionReason === "ALLOWANCE_IN_PROGRESS" && reclaim)) {
				throw new Error("發票目前有待確認的作業，請先完成查核");
			}
		}
		const operationToken = randomUUID();
		const claimed = await tx.invoice.updateMany({
			where: reclaim
				? {
						id: invoice.id,
						status: { in: ["ISSUED", "ALLOWANCE"] },
						attentionReason: "ALLOWANCE_IN_PROGRESS",
						OR: [{ operationStartedAt: null }, { operationStartedAt: { lt: new Date(Date.now() - INVOICE_OPERATION_LEASE_MS) } }],
					}
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
				data: {
					invoiceId: invoice.id,
					allowanceId,
					provider: invoice.provider,
					amount: args.amount,
					errorMessage: systemTrigger ? systemTriggerMarker(systemTrigger) : null,
				},
			});
		}
		const sourceInvoiceType = invoice.order?.invoiceType ?? invoice.subscription?.invoiceType;
		return {
			completed: false as const,
			invoice,
			amount: args.amount,
			allowanceId,
			sourceInvoiceType,
			operationToken,
			reclaim,
		};
	});

	if (!reservation) throw new InvoiceOperationNotFoundError();
	if (reservation.completed) {
		return { invoice: reservation.invoice, amount: reservation.amount, alreadyCompleted: true };
	}

	const provider = await getInvoiceProvider(reservation.invoice.provider as "ecpay" | "ezpay");
	if (!provider) {
		await withInvoiceOperationLock(async (tx) => {
			await tx.invoiceAllowanceOperation.update({
				where: { allowanceId: reservation.allowanceId },
				data: { status: "UNKNOWN", errorMessage: "電子發票尚未完成設定，或目前設定與發票供應商不一致。" },
			});
			await tx.invoice.updateMany({
				where: {
					id: reservation.invoice.id,
					attentionReason: "ALLOWANCE_IN_PROGRESS",
					operationToken: reservation.operationToken,
				},
				data: {
					attentionReason: "ALLOWANCE_NEEDS_REVIEW",
					operationToken: null,
					operationStartedAt: null,
					failReason: "電子發票尚未完成設定，或目前設定與發票供應商不一致。",
				},
			});
		});
		throw new Error("電子發票尚未完成設定，或目前設定與發票供應商不一致。");
	}

	if (reservation.reclaim) {
		if (!provider.queryAllowance) {
			await withInvoiceOperationLock(async (tx) => {
				await tx.invoiceAllowanceOperation.update({
					where: { allowanceId: reservation.allowanceId },
					data: { status: "UNKNOWN", errorMessage: "折讓結果待查，provider 不支援折讓查詢" },
				});
				await tx.invoice.updateMany({
					where: {
						id: reservation.invoice.id,
						attentionReason: "ALLOWANCE_IN_PROGRESS",
						operationToken: reservation.operationToken,
					},
					data: {
						attentionReason: "ALLOWANCE_NEEDS_REVIEW",
						operationToken: null,
						operationStartedAt: null,
						failReason: "折讓結果待查，provider 不支援折讓查詢",
					},
				});
			});
			throw new Error("折讓結果待查，provider 不支援折讓查詢");
		}
		const queried = await provider.queryAllowance({
			invoiceNumber: reservation.invoice.invoiceNumber!,
			allowanceId: reservation.allowanceId,
			invoiceDate: reservation.invoice.invoiceDate,
		});
		if (queried.status === "SUCCEEDED") {
			const recovered = await withInvoiceOperationLock(async (tx) => {
				const updated = await tx.invoice.updateMany({
					where: {
						id: reservation.invoice.id,
						status: { in: ["ISSUED", "ALLOWANCE"] },
						attentionReason: "ALLOWANCE_IN_PROGRESS",
						operationToken: reservation.operationToken,
					},
					data: {
						status: "ALLOWANCE",
						allowanceTotal: { increment: reservation.amount },
						attentionReason: null,
						operationToken: null,
						operationStartedAt: null,
						failReason: null,
					},
				});
				if (updated.count !== 1) return null;
				await tx.invoiceAllowanceOperation.update({
					where: { allowanceId: reservation.allowanceId },
					data: {
						status: "SUCCEEDED",
						allowanceNumber: queried.allowanceNumber,
						errorMessage: systemTrigger ? systemTriggerMarker(systemTrigger) : null,
					},
				});
				const invoice = await tx.invoice.findUnique({ where: { id: reservation.invoice.id } });
				return invoice ? { invoice, amount: reservation.amount } : null;
			});
			if (!recovered) throw new Error("折讓結果無法安全寫回，請查核供應商結果。");
			return { invoice: recovered.invoice, amount: recovered.amount, alreadyCompleted: false };
		}
		const reason = queried.error ?? "折讓結果待查";
		await withInvoiceOperationLock(async (tx) => {
			await tx.invoiceAllowanceOperation.update({
				where: { allowanceId: reservation.allowanceId },
				data: { status: "UNKNOWN", errorMessage: reason },
			});
			await tx.invoice.updateMany({
				where: {
					id: reservation.invoice.id,
					attentionReason: "ALLOWANCE_IN_PROGRESS",
					operationToken: reservation.operationToken,
				},
				data: {
					attentionReason: "ALLOWANCE_NEEDS_REVIEW",
					operationToken: null,
					operationStartedAt: null,
					failReason: reason,
				},
			});
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
			amount: args.amount,
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
				where: {
					id: reservation.invoice.id,
					attentionReason: "ALLOWANCE_IN_PROGRESS",
					operationToken: reservation.operationToken,
				},
				data: {
					attentionReason:
						error instanceof InvoiceAllowanceError && error.ambiguous
							? "ALLOWANCE_NEEDS_REVIEW"
							: definiteFailureAttentionReason,
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
			where: {
				id: reservation.invoice.id,
				status: { in: ["ISSUED", "ALLOWANCE"] },
				attentionReason: "ALLOWANCE_IN_PROGRESS",
				operationToken: reservation.operationToken,
			},
			data: {
				status: result.status,
				allowanceTotal: { increment: args.amount },
				attentionReason: null,
				operationToken: null,
				operationStartedAt: null,
				failReason: null,
			},
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
			data: {
				status: "SUCCEEDED",
				allowanceNumber: result.allowanceNumber,
				errorMessage: systemTrigger ? systemTriggerMarker(systemTrigger) : null,
			},
		});
		const updatedInvoice = await tx.invoice.findUnique({ where: { id: reservation.invoice.id } });
		return updatedInvoice ? { invoice: updatedInvoice, amount: args.amount } : null;
	});
	if (!operation) throw new InvoiceOperationNotFoundError();
	return { invoice: operation.invoice, amount: operation.amount, alreadyCompleted: false };
}

export type { InvoiceWithSource };
