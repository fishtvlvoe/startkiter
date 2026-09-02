import { randomUUID } from "node:crypto";

import { buildIssueInput, type InvoiceProvider } from "@startkiter/payments";
import { db, type Prisma } from "@startkiter/database";

import { createInvoiceProvider, getInvoiceSettings, INVOICE_OPERATION_LEASE_MS, isInvoiceProviderName, withInvoiceOperationLock } from "./invoice-settings";
import { acquireOrderStateLock } from "./order-refunds";
import { runInvoiceAllowanceOperation } from "./run-invoice-allowance-operation";
import { sameTaiwanBillingMonth } from "./taiwan-billing-month";

type InvoiceRecord = Prisma.InvoiceGetPayload<{}>;
type InvoiceIssueInput = Parameters<InvoiceProvider["issue"]>[0];
type InvoiceIssueJob = {
	invoiceId: string;
	provider: InvoiceProvider | null;
	input: InvoiceIssueInput;
	source: InvoiceIssueSource;
	operationToken: string;
	recoverBeforeIssue: boolean;
};
type InvoiceIssueSource = { kind: "order"; id: string } | { kind: "subscription"; id: string };
type InvoiceIssueReservation = { invoice: InvoiceRecord } | { job: InvoiceIssueJob } | null;
type InvoiceRefundJob = {
	invoiceId: string;
	provider: InvoiceProvider;
	invoiceNumber: string;
	randomCode: string | null;
	invoiceDate: Date;
	operationToken: string;
	recoverBeforeVoid: boolean;
};
type InvoiceAutoAllowanceJob = {
	invoiceId: string;
	amount: number;
	operationToken: string;
};
type InvoiceRefundReservation =
	| { invoice: InvoiceRecord }
	| { job: InvoiceRefundJob }
	| { autoAllowance: InvoiceAutoAllowanceJob }
	| null;

function isStaleOperation(invoice: InvoiceRecord, now = Date.now()): boolean {
	return !invoice.operationStartedAt || now - invoice.operationStartedAt.getTime() >= INVOICE_OPERATION_LEASE_MS;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
	if (value === undefined) return undefined;
	try {
		JSON.stringify(value);
		return value as Prisma.InputJsonValue;
	} catch {
		return undefined;
	}
}

function invoicePreference(row: {
	invoiceType: string | null;
	invoiceCarrierType: string | null;
	invoiceCarrierId: string | null;
	invoiceTaxId: string | null;
	invoiceTitle: string | null;
	invoiceAddress: string | null;
	invoiceLoveCode: string | null;
}) {
	return {
		invoiceType: row.invoiceType as "PERSONAL" | "COMPANY" | "DONATION" | null,
		carrierType: row.invoiceCarrierType,
		carrierId: row.invoiceCarrierId,
		taxId: row.invoiceTaxId,
		title: row.invoiceTitle,
		address: row.invoiceAddress,
		loveCode: row.invoiceLoveCode,
	};
}


function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message.slice(0, 500) : "電子發票開立失敗";
}

function isRetryableInvoiceStatus(invoice: InvoiceRecord): boolean {
	if (invoice.status === "FAILED") return true;
	if (invoice.status !== "PENDING") return false;
	if (!invoice.operationToken && !invoice.attentionReason) return true;
	return Date.now() - invoice.updatedAt.getTime() >= INVOICE_OPERATION_LEASE_MS;
}

async function reserveOrderInvoice(orderId: string): Promise<InvoiceIssueReservation> {
	return withInvoiceOperationLock(async (tx) => {
		const settings = await getInvoiceSettings(tx);
		if (!settings.einvoiceEnabled || !settings.autoIssueEnabled) return null;
		const provider = createInvoiceProvider(settings);
		await acquireOrderStateLock(tx, orderId);
		const order = await tx.order.findUnique({ where: { id: orderId }, include: { user: true } });
		if (!order) return null;
		const existing = await tx.invoice.findUnique({ where: { orderId } });
		if (order.status !== "paid") return existing ? { invoice: existing } : null;
		if (
			existing?.attentionReason &&
			!(["ISSUE_IN_PROGRESS", "ISSUE_NEEDS_REVIEW"] as string[]).includes(existing.attentionReason)
		) return { invoice: existing };
		if (existing?.attentionReason === "ISSUE_IN_PROGRESS" && !isStaleOperation(existing)) {
			return { invoice: existing };
		}
			if (existing?.attentionReason === "ISSUE_NEEDS_REVIEW" && !isStaleOperation(existing)) return { invoice: existing };
		if (existing && existing.status !== "FAILED" && !isRetryableInvoiceStatus(existing)) return { invoice: existing };

		const operationToken = randomUUID();
		const input = buildIssueInput({
			orderNo: order.orderNo,
			amount: order.amount,
			itemName: order.sku,
			buyerName: order.user.name,
			buyerEmail: order.user.email,
			preference: invoicePreference(order),
			provider: settings.provider,
		});
		const invoice = existing
			? await tx.invoice.update({
						where: { id: existing.id },
						data: { provider: settings.provider, status: "PENDING", amount: order.amount, attentionReason: "ISSUE_IN_PROGRESS", operationToken, operationStartedAt: new Date(), failReason: null },
					})
			: await tx.invoice.create({
					data: { provider: settings.provider, status: "PENDING", amount: order.amount, attentionReason: "ISSUE_IN_PROGRESS", operationToken, operationStartedAt: new Date(), order: { connect: { id: orderId } } },
				});
		return { job: { invoiceId: invoice.id, provider, input, source: { kind: "order", id: orderId }, operationToken, recoverBeforeIssue: existing?.operationToken !== null && existing?.operationToken !== undefined } };
	});
}

type InvoiceIssueFinalization = { invoice: InvoiceRecord; sourceChanged: boolean } | null;

async function finalizeInvoiceIssue(
	invoiceId: string,
	operationToken: string,
	result: Awaited<ReturnType<InvoiceProvider["issue"]>> | { failReason: string },
	source: InvoiceIssueSource,
): Promise<InvoiceIssueFinalization> {
	return withInvoiceOperationLock(async (tx) => {
		const existing = await tx.invoice.findUnique({ where: { id: invoiceId } });
		if (!existing || (existing.status !== "PENDING" && existing.status !== "FAILED") || existing.operationToken !== operationToken) {
			return existing ? { invoice: existing, sourceChanged: false } : null;
		}
		if ("failReason" in result) {
			const ambiguous = "ambiguous" in result && result.ambiguous === true;
			const invoice = await tx.invoice.update({
				where: { id: invoiceId },
				data: {
					status: "FAILED",
					attentionReason: ambiguous ? "ISSUE_NEEDS_REVIEW" : null,
					operationToken: ambiguous ? operationToken : null,
					operationStartedAt: ambiguous ? new Date() : null,
					failReason: result.failReason,
				},
			});
			return { invoice, sourceChanged: false };
		}
		let sourceIsInvalid = false;
		if (source.kind === "order") {
			sourceIsInvalid = (await tx.order.findUnique({ where: { id: source.id }, select: { status: true } }))?.status !== "paid";
		} else {
			const subscription = await tx.courseSubscription.findUnique({ where: { id: source.id }, select: { status: true, canceledAt: true } });
			sourceIsInvalid = !subscription || subscription.status === "CANCELED" || subscription.canceledAt !== null;
		}
		const invoice = await tx.invoice.update({
			where: { id: invoiceId },
			data: {
				status: "ISSUED",
				invoiceNumber: result.invoiceNumber,
				randomCode: result.randomCode,
				invoiceDate: result.invoiceDate,
					rawResponse: jsonValue(result.raw),
					attentionReason: sourceIsInvalid ? "VOID_AFTER_REFUND" : null,
					operationToken: null,
					operationStartedAt: null,
					failReason: null,
			},
		});
		return { invoice, sourceChanged: sourceIsInvalid };
	});
}

async function finalizeSourceChangedInvoice(invoiceId: string, result: { success: boolean; error?: string }): Promise<InvoiceRecord | null> {
	return withInvoiceOperationLock(async (tx) => {
		const updated = await tx.invoice.updateMany({
			where: { id: invoiceId, status: "ISSUED", attentionReason: "VOID_AFTER_REFUND" },
			data: result.success
				? { status: "VOIDED", attentionReason: null, failReason: null }
				: { attentionReason: "REFUND_NEEDS_ALLOWANCE", failReason: result.error ?? "退款後發票作廢結果待查" },
		});
		if (updated.count !== 1) return null;
		return tx.invoice.findUnique({ where: { id: invoiceId } });
	});
}

async function runInvoiceIssue(reservation: InvoiceIssueReservation): Promise<InvoiceRecord | null> {
	if (!reservation) return null;
	if ("invoice" in reservation) return reservation.invoice;
	if (!reservation.job.provider) {
		const finalization = await finalizeInvoiceIssue(reservation.job.invoiceId, reservation.job.operationToken, { failReason: "電子發票 provider 尚未設定完整" }, reservation.job.source);
		return finalization?.invoice ?? null;
	}
	try {
		if (reservation.job.recoverBeforeIssue) {
			if (!reservation.job.provider.query) {
				const finalization = await finalizeInvoiceIssue(
					reservation.job.invoiceId,
					reservation.job.operationToken,
					{ failReason: "供應商不支援開票結果查詢，需人工確認", ambiguous: true },
					reservation.job.source,
				);
				return finalization?.invoice ?? null;
			}
			const queried = await reservation.job.provider.query({
				orderId: reservation.job.input.orderId,
				amount: reservation.job.input.amount.totalAmount,
			});
			if (queried.status === "ISSUED" && queried.invoiceNumber && queried.invoiceDate && queried.randomCode) {
				const finalization = await finalizeInvoiceIssue(reservation.job.invoiceId, reservation.job.operationToken, {
					invoiceNumber: queried.invoiceNumber,
					randomCode: queried.randomCode,
					invoiceDate: queried.invoiceDate,
					raw: queried.raw,
				}, reservation.job.source);
				if (!finalization?.invoice || !finalization.sourceChanged) return finalization?.invoice ?? null;
				const invoice = finalization.invoice;
				if (!invoice.invoiceNumber || !invoice.invoiceDate || !sameTaiwanBillingMonth(invoice.invoiceDate, new Date())) {
					return finalizeSourceChangedInvoice(invoice.id, { success: false, error: "退款後已跨月，請改用折讓" });
				}
				try {
					const voidResult = await reservation.job.provider.void({ invoiceNumber: invoice.invoiceNumber, reason: "退款", invoiceDate: invoice.invoiceDate });
					return finalizeSourceChangedInvoice(invoice.id, voidResult);
				} catch (error) {
					return finalizeSourceChangedInvoice(invoice.id, { success: false, error: errorMessage(error) });
				}
				}
				if (queried.status === "NOT_FOUND") {
					const result = await reservation.job.provider.issue(reservation.job.input);
					const finalization = await finalizeInvoiceIssue(reservation.job.invoiceId, reservation.job.operationToken, result, reservation.job.source);
					return finalization?.invoice ?? null;
				}
			return finalizeInvoiceIssue(reservation.job.invoiceId, reservation.job.operationToken, {
				failReason: queried.error ?? "供應商開票結果待查，禁止重送",
				ambiguous: true,
			}, reservation.job.source).then((result) => result?.invoice ?? null);
		}
		const result = await reservation.job.provider.issue(reservation.job.input);
		const finalization = await finalizeInvoiceIssue(reservation.job.invoiceId, reservation.job.operationToken, result, reservation.job.source);
		if (!finalization?.invoice || !finalization.sourceChanged) return finalization?.invoice ?? null;
		const invoice = finalization.invoice;
		if (!invoice.invoiceNumber || !invoice.invoiceDate || !sameTaiwanBillingMonth(invoice.invoiceDate, new Date())) {
					return finalizeSourceChangedInvoice(invoice.id, { success: false, error: "退款後已跨月，請改用折讓" });
		}
		try {
			const voidResult = await reservation.job.provider.void({ invoiceNumber: invoice.invoiceNumber, reason: "退款", invoiceDate: invoice.invoiceDate });
					return finalizeSourceChangedInvoice(invoice.id, voidResult);
		} catch (error) {
			return finalizeSourceChangedInvoice(invoice.id, { success: false, error: errorMessage(error) });
		}
	} catch (error) {
		const finalization = await finalizeInvoiceIssue(reservation.job.invoiceId, reservation.job.operationToken, { failReason: errorMessage(error), ambiguous: true }, reservation.job.source);
		return finalization?.invoice ?? null;
	}
}

export async function triggerInvoiceForOrder(orderId: string): Promise<InvoiceRecord | null> {
	return runInvoiceIssue(await reserveOrderInvoice(orderId));
}

export async function triggerInvoiceForSubscriptionPeriod(
	subscriptionId: string,
	periodNumber: number,
): Promise<InvoiceRecord | null> {
	const reservation = await withInvoiceOperationLock(async (tx) => {
		const settings = await getInvoiceSettings(tx);
		if (!settings.einvoiceEnabled || !settings.autoIssueEnabled) return null;
		const provider = createInvoiceProvider(settings);
		const existing = await tx.invoice.findFirst({ where: { subscriptionId, periodNumber } });
		if (
			existing?.attentionReason &&
			!(["ISSUE_IN_PROGRESS", "ISSUE_NEEDS_REVIEW"] as string[]).includes(existing.attentionReason)
		) return { invoice: existing };
		if (existing?.attentionReason === "ISSUE_IN_PROGRESS" && !isStaleOperation(existing)) {
			return { invoice: existing };
		}
		if (existing?.attentionReason === "ISSUE_NEEDS_REVIEW" && !isStaleOperation(existing)) return { invoice: existing };
		if (existing && existing.status !== "FAILED" && !isRetryableInvoiceStatus(existing)) return { invoice: existing };
		const subscription = await tx.courseSubscription.findUnique({
			where: { id: subscriptionId },
			include: { user: true, plan: { include: { course: true } } },
		});
		if (!subscription) return null;
		if (subscription.status === "CANCELED" || subscription.canceledAt !== null) return existing ? { invoice: existing } : null;
		const operationToken = randomUUID();
		const input = buildIssueInput({
			orderNo: `${subscription.gatewayTradeNo}-${periodNumber}`,
			amount: subscription.pricePerPeriod,
			itemName: subscription.plan.course.title,
			buyerName: subscription.user.name,
			buyerEmail: subscription.user.email,
			preference: invoicePreference(subscription),
			provider: settings.provider,
		});
		const invoice = existing
			? await tx.invoice.update({
					where: { id: existing.id },
					data: { provider: settings.provider, status: "PENDING", amount: subscription.pricePerPeriod, attentionReason: "ISSUE_IN_PROGRESS", operationToken, operationStartedAt: new Date(), failReason: null },
				})
			: await tx.invoice.create({
					data: {
						provider: settings.provider,
							status: "PENDING",
							amount: subscription.pricePerPeriod,
							attentionReason: "ISSUE_IN_PROGRESS",
							operationToken,
							operationStartedAt: new Date(),
						subscription: { connect: { id: subscriptionId } },
						periodNumber,
					},
				});
			return { job: { invoiceId: invoice.id, provider, input, source: { kind: "subscription" as const, id: subscriptionId }, operationToken, recoverBeforeIssue: existing?.operationToken !== null && existing?.operationToken !== undefined } };
	});
	return runInvoiceIssue(reservation);
}

async function reserveRefundInvoice(
	findInvoice: (tx: Prisma.TransactionClient) => Promise<InvoiceRecord | null>,
	now: Date,
): Promise<InvoiceRefundReservation> {
	return withInvoiceOperationLock(async (tx) => {
		const invoice = await findInvoice(tx);
		if (!invoice || !invoice.invoiceNumber) return invoice ? { invoice } : null;
		if (invoice.status !== "ISSUED" && invoice.status !== "ALLOWANCE") return { invoice };

		const recoverableRefundMarker = ["REFUND_IN_PROGRESS", "VOID_AFTER_REFUND", "VOID_IN_PROGRESS"].includes(invoice.attentionReason ?? "");
		const staleRefund = recoverableRefundMarker && isStaleOperation(invoice);
		if (recoverableRefundMarker && !staleRefund) {
			return { invoice };
		}

		if (invoice.attentionReason && !recoverableRefundMarker) return { invoice };
		const settings = await getInvoiceSettings(tx);
		const provider = isInvoiceProviderName(invoice.provider) && settings.provider === invoice.provider ? createInvoiceProvider(settings) : null;
		if (!provider || !invoice.invoiceDate) {
			return { invoice: await tx.invoice.update({
				where: { id: invoice.id },
				data: { attentionReason: "REFUND_NEEDS_ALLOWANCE" },
			}) };
		}

		const crossMonth = !sameTaiwanBillingMonth(invoice.invoiceDate, now);
		// R6：void／退款結果未知（含 stale）不得改走自動折讓，避免雙重沖銷
		if (recoverableRefundMarker && staleRefund) {
			if (crossMonth || invoice.status === "ALLOWANCE") {
				return {
					invoice: await tx.invoice.update({
						where: { id: invoice.id },
						data: {
							attentionReason: "REFUND_NEEDS_ALLOWANCE",
							operationToken: null,
							operationStartedAt: null,
							failReason: "作廢結果待查，已跨月或已折讓，請改用折讓",
						},
					}),
				};
			}
			const operationToken = randomUUID();
			await tx.invoice.update({
				where: { id: invoice.id },
				data: { attentionReason: "REFUND_IN_PROGRESS", operationToken, operationStartedAt: new Date(), failReason: null },
			});
			return {
				job: {
					invoiceId: invoice.id,
					provider,
					invoiceNumber: invoice.invoiceNumber,
					randomCode: invoice.randomCode,
					invoiceDate: invoice.invoiceDate,
					operationToken,
					recoverBeforeVoid: true,
				},
			};
		}

		// 跨月，或發票已是 ALLOWANCE（只能折讓剩餘額）：自動全額折讓
		if (crossMonth || invoice.status === "ALLOWANCE") {
			const remaining = invoice.amount - invoice.allowanceTotal;
			if (remaining <= 0) {
				return {
					invoice: await tx.invoice.update({
						where: { id: invoice.id },
						data: { attentionReason: null, failReason: null },
					}),
				};
			}
			const operationToken = randomUUID();
			const claimed = await tx.invoice.updateMany({
				where: {
					id: invoice.id,
					status: { in: ["ISSUED", "ALLOWANCE"] },
					attentionReason: invoice.attentionReason,
				},
				data: {
					attentionReason: "ALLOWANCE_IN_PROGRESS",
					operationToken,
					operationStartedAt: new Date(),
					failReason: null,
				},
			});
			if (claimed.count !== 1) {
				return { invoice };
			}
			return { autoAllowance: { invoiceId: invoice.id, amount: remaining, operationToken } };
		}

		const operationToken = randomUUID();
		await tx.invoice.update({
			where: { id: invoice.id },
			data: { attentionReason: "REFUND_IN_PROGRESS", operationToken, operationStartedAt: new Date(), failReason: null },
		});
		return {
			job: {
				invoiceId: invoice.id,
				provider,
				invoiceNumber: invoice.invoiceNumber,
				randomCode: invoice.randomCode,
				invoiceDate: invoice.invoiceDate,
				operationToken,
				recoverBeforeVoid: false,
			},
		};
	});
}

async function finalizeInvoiceRefund(invoiceId: string, operationToken: string, result: { success: boolean; error?: string }): Promise<InvoiceRecord | null> {
	return withInvoiceOperationLock(async (tx) => {
		const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
		if (!invoice || invoice.status !== "ISSUED" || invoice.attentionReason !== "REFUND_IN_PROGRESS" || invoice.operationToken !== operationToken) return invoice;
		const updated = await tx.invoice.updateMany({
			where: { id: invoiceId, status: "ISSUED", attentionReason: "REFUND_IN_PROGRESS", operationToken },
			data: result.success
				? { status: "VOIDED", attentionReason: null, operationToken: null, operationStartedAt: null, failReason: null }
				: { attentionReason: "REFUND_NEEDS_ALLOWANCE", operationToken: null, operationStartedAt: null, failReason: result.error },
		});
		if (updated.count !== 1) return null;
		return tx.invoice.findUnique({ where: { id: invoiceId } });
	});
}

async function runInvoiceRefund(reservation: InvoiceRefundReservation): Promise<InvoiceRecord | null> {
	if (!reservation) return null;
	if ("autoAllowance" in reservation) {
		try {
			const result = await runInvoiceAllowanceOperation({
				invoiceId: reservation.autoAllowance.invoiceId,
				amount: reservation.autoAllowance.amount,
				definiteFailureAttentionReason: "REFUND_NEEDS_ALLOWANCE",
				systemTrigger: "auto-cross-month-refund",
				resumeOperationToken: reservation.autoAllowance.operationToken,
			});
			return result.invoice;
		} catch {
			return withInvoiceOperationLock(async (tx) =>
				tx.invoice.findUnique({ where: { id: reservation.autoAllowance.invoiceId } }),
			);
		}
	}
	if ("invoice" in reservation) return reservation.invoice;
	try {
		if (reservation.job.recoverBeforeVoid) {
			if (!reservation.job.provider.query) return finalizeInvoiceRefund(reservation.job.invoiceId, reservation.job.operationToken, { success: false, error: "作廢結果待查，provider 不支援查詢" });
			const queried = await reservation.job.provider.query({
				invoiceNumber: reservation.job.invoiceNumber,
				randomCode: reservation.job.randomCode ?? undefined,
				invoiceDate: reservation.job.invoiceDate,
			});
			if (queried.status === "VOIDED") return finalizeInvoiceRefund(reservation.job.invoiceId, reservation.job.operationToken, { success: true });
			if (queried.status !== "ISSUED") return finalizeInvoiceRefund(reservation.job.invoiceId, reservation.job.operationToken, { success: false, error: queried.error ?? "作廢結果待查" });
		}
		const result = await reservation.job.provider.void({
			invoiceNumber: reservation.job.invoiceNumber,
			reason: "退款",
			invoiceDate: reservation.job.invoiceDate,
		});
		return finalizeInvoiceRefund(reservation.job.invoiceId, reservation.job.operationToken, result);
	} catch (error) {
		return finalizeInvoiceRefund(reservation.job.invoiceId, reservation.job.operationToken, { success: false, error: errorMessage(error) });
	}
}

const refundInvoiceInclude = {
	order: { select: { invoiceType: true } },
	subscription: { select: { invoiceType: true } },
} as const;

export async function handleRefundInvoice(orderId: string, now = new Date()): Promise<InvoiceRecord | null> {
	return runInvoiceRefund(await reserveRefundInvoice(
		(tx) => tx.invoice.findUnique({ where: { orderId }, include: refundInvoiceInclude }),
		now,
	));
}

export async function handleRefundInvoiceForSubscription(
	subscriptionId: string,
	now = new Date(),
): Promise<InvoiceRecord | null> {
	return runInvoiceRefund(await reserveRefundInvoice(
		(tx) => tx.invoice.findFirst({
			where: { subscriptionId, status: { in: ["ISSUED", "ALLOWANCE"] } },
			orderBy: { periodNumber: "desc" },
			include: refundInvoiceInclude,
		}),
		now,
	));
}

async function recoverStaleAllowance(invoiceId: string): Promise<InvoiceRecord | null> {
	const reservation = await withInvoiceOperationLock(async (tx) => {
		const invoice = await tx.invoice.findUnique({
			where: { id: invoiceId },
			include: { allowanceOperations: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 1 } },
		});
		if (!invoice || invoice.attentionReason !== "ALLOWANCE_IN_PROGRESS" || !isStaleOperation(invoice)) return null;
		const operation = invoice.allowanceOperations[0];
		if (!operation || !invoice.invoiceNumber || !isInvoiceProviderName(invoice.provider)) return { invoice };
		const settings = await getInvoiceSettings(tx);
		const provider = settings.provider === invoice.provider ? createInvoiceProvider(settings) : null;
		const operationToken = randomUUID();
		const claimed = await tx.invoice.updateMany({
			where: { id: invoice.id, attentionReason: "ALLOWANCE_IN_PROGRESS", OR: [{ operationStartedAt: null }, { operationStartedAt: { lte: new Date(Date.now() - INVOICE_OPERATION_LEASE_MS) } }] },
			data: { operationToken, operationStartedAt: new Date() },
		});
		if (claimed.count !== 1) return null;
		return { job: { invoiceId: invoice.id, operationToken, invoiceNumber: invoice.invoiceNumber, allowanceId: operation.allowanceId, provider, invoiceDate: invoice.invoiceDate } };
	});
	if (!reservation) return null;
	if ("invoice" in reservation) {
		return withInvoiceOperationLock(async (tx) => {
			await tx.invoice.updateMany({
				where: { id: invoiceId, attentionReason: "ALLOWANCE_IN_PROGRESS" },
				data: { attentionReason: "ALLOWANCE_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: "折讓作業缺少可查詢的本地資料" },
			});
			return tx.invoice.findUnique({ where: { id: invoiceId } });
		});
	}
	const job = reservation.job;
	if (!job.provider?.queryAllowance) {
		return withInvoiceOperationLock(async (tx) => {
			await tx.invoice.updateMany({
				where: { id: job.invoiceId, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: job.operationToken },
				data: { attentionReason: "ALLOWANCE_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: "折讓結果待查，provider 不支援折讓查詢" },
			});
			await tx.invoiceAllowanceOperation.updateMany({ where: { invoiceId: job.invoiceId, allowanceId: job.allowanceId, status: "PENDING" }, data: { status: "UNKNOWN", errorMessage: "折讓結果待查，provider 不支援折讓查詢" } });
			return tx.invoice.findUnique({ where: { id: job.invoiceId } });
		});
	}
	try {
		const queried = await job.provider.queryAllowance({ invoiceNumber: job.invoiceNumber, allowanceId: job.allowanceId, invoiceDate: job.invoiceDate });
		return withInvoiceOperationLock(async (tx) => {
			if (queried.status === "SUCCEEDED") {
				const updated = await tx.invoice.updateMany({
					where: { id: job.invoiceId, status: { in: ["ISSUED", "ALLOWANCE"] }, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: job.operationToken },
					data: { status: "ALLOWANCE", allowanceTotal: { increment: (await tx.invoiceAllowanceOperation.findUnique({ where: { allowanceId: job.allowanceId } }))?.amount ?? 0 }, attentionReason: null, operationToken: null, operationStartedAt: null, failReason: null },
				});
				if (updated.count === 1) {
					const existing = await tx.invoiceAllowanceOperation.findUnique({ where: { allowanceId: job.allowanceId } });
					const preservedTrigger =
						existing?.errorMessage?.startsWith("[trigger:system:") ? existing.errorMessage : null;
					await tx.invoiceAllowanceOperation.update({
						where: { allowanceId: job.allowanceId },
						data: {
							status: "SUCCEEDED",
							allowanceNumber: queried.allowanceNumber,
							errorMessage: preservedTrigger,
						},
					});
				}
			} else {
				await tx.invoice.updateMany({ where: { id: job.invoiceId, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: job.operationToken }, data: { attentionReason: "ALLOWANCE_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: queried.error ?? "折讓結果待查" } });
				await tx.invoiceAllowanceOperation.updateMany({ where: { invoiceId: job.invoiceId, allowanceId: job.allowanceId, status: "PENDING" }, data: { status: "UNKNOWN", errorMessage: queried.error ?? "折讓結果待查" } });
			}
			return tx.invoice.findUnique({ where: { id: job.invoiceId } });
		});
	} catch (error) {
		return withInvoiceOperationLock(async (tx) => {
			await tx.invoice.updateMany({ where: { id: job.invoiceId, attentionReason: "ALLOWANCE_IN_PROGRESS", operationToken: job.operationToken }, data: { attentionReason: "ALLOWANCE_NEEDS_REVIEW", operationToken: null, operationStartedAt: null, failReason: errorMessage(error) } });
			await tx.invoiceAllowanceOperation.updateMany({ where: { invoiceId: job.invoiceId, allowanceId: job.allowanceId, status: "PENDING" }, data: { status: "UNKNOWN", errorMessage: errorMessage(error) } });
			return tx.invoice.findUnique({ where: { id: job.invoiceId } });
		});
	}
}

export async function retryPendingInvoices(limit = 50): Promise<{ scanned: number; issued: number; failed: number }> {
	const cutoff = new Date(Date.now() - INVOICE_OPERATION_LEASE_MS);
	const pending = await db.invoice.findMany({
		where: {
			OR: [
				{ status: { in: ["PENDING", "FAILED"] }, updatedAt: { lte: cutoff } },
				{ status: "ISSUED", order: { status: "refunded" } },
				{ status: "ISSUED", subscription: { status: "CANCELED" } },
					{ status: "ISSUED", attentionReason: "REFUND_IN_PROGRESS", OR: [{ operationStartedAt: null }, { operationStartedAt: { lte: cutoff } }] },
				{ status: "ISSUED", attentionReason: { in: ["VOID_AFTER_REFUND", "VOID_IN_PROGRESS"] }, OR: [{ operationStartedAt: null }, { operationStartedAt: { lte: cutoff } }] },
				{ status: { in: ["ISSUED", "ALLOWANCE"] }, attentionReason: "ALLOWANCE_IN_PROGRESS", OR: [{ operationStartedAt: null }, { operationStartedAt: { lte: cutoff } }] },
			],
		},
		orderBy: { updatedAt: "asc" },
		take: limit,
		select: { id: true, orderId: true, subscriptionId: true, periodNumber: true, order: { select: { status: true } }, subscription: { select: { status: true } }, attentionReason: true },
	});
	let issued = 0;
	let failed = 0;
	for (const invoice of pending) {
		const result = await (invoice.attentionReason === "ALLOWANCE_IN_PROGRESS"
			? recoverStaleAllowance(invoice.id)
			: invoice.orderId
			? invoice.order?.status === "refunded"
				? handleRefundInvoice(invoice.orderId)
				: triggerInvoiceForOrder(invoice.orderId)
			: invoice.subscriptionId && invoice.periodNumber !== null
				? invoice.subscription?.status === "CANCELED"
					? handleRefundInvoiceForSubscription(invoice.subscriptionId)
						: triggerInvoiceForSubscriptionPeriod(invoice.subscriptionId, invoice.periodNumber)
				: null);
		if (result?.status === "ISSUED" || result?.status === "VOIDED") issued += 1;
		if (result?.status === "FAILED") failed += 1;
	}
	return { scanned: pending.length, issued, failed };
}
