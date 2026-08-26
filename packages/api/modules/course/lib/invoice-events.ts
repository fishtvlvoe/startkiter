import { buildIssueInput, type InvoiceProvider } from "@startkiter/payments";
import { type Prisma } from "@startkiter/database";

import { getInvoiceProvider, getInvoiceSettings, isInvoiceProviderName, withInvoiceOperationLock } from "./invoice-settings";
import { acquireOrderStateLock } from "./order-refunds";
import { sameTaiwanBillingMonth } from "./taiwan-billing-month";

type InvoiceRecord = Prisma.InvoiceGetPayload<{}>;

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

async function createFailedInvoice(client: Prisma.TransactionClient, args: {
	provider: "ecpay" | "ezpay";
	amount: number;
	orderId?: string;
	subscriptionId?: string;
	periodNumber?: number;
	failReason: string;
}): Promise<InvoiceRecord> {
	return client.invoice.create({
		data: {
			provider: args.provider,
			status: "FAILED",
			amount: args.amount,
			order: args.orderId ? { connect: { id: args.orderId } } : undefined,
			subscription: args.subscriptionId ? { connect: { id: args.subscriptionId } } : undefined,
			periodNumber: args.periodNumber,
			failReason: args.failReason,
		},
	});
}

async function recordFailedInvoice(
	client: Prisma.TransactionClient,
	args: Parameters<typeof createFailedInvoice>[1],
	existing: InvoiceRecord | null,
): Promise<InvoiceRecord> {
	if (existing) {
		return client.invoice.update({
			where: { id: existing.id },
			data: { provider: args.provider, status: "FAILED", amount: args.amount, failReason: args.failReason },
		});
	}
	return createFailedInvoice(client, args);
}

async function issueForOrder(
	client: Prisma.TransactionClient,
	orderId: string,
	provider: InvoiceProvider | null,
	providerName: "ecpay" | "ezpay",
) {
	const order = await client.order.findUnique({
		where: { id: orderId },
		include: { user: true },
	});
	if (!order) return null;

	const existing = await client.invoice.findUnique({ where: { orderId } });
	if (order.status !== "paid") return existing;
	if (existing && existing.status !== "FAILED") return existing;
	if (!provider) {
		return recordFailedInvoice(client, {
			provider: providerName,
			amount: order.amount,
			orderId,
			failReason: "電子發票 provider 尚未設定完整",
		}, existing);
	}

	try {
		const result = await provider.issue(
			buildIssueInput({
				orderNo: order.orderNo,
				amount: order.amount,
				itemName: order.sku,
				buyerName: order.user.name,
				buyerEmail: order.user.email,
				preference: invoicePreference(order),
				provider: providerName,
			}),
		);
		if ("failReason" in result) {
			return recordFailedInvoice(client, { provider: providerName, amount: order.amount, orderId, failReason: result.failReason }, existing);
		}
		if (existing) {
			return client.invoice.update({
				where: { id: existing.id },
				data: {
					provider: providerName,
					status: "ISSUED",
					amount: order.amount,
					invoiceNumber: result.invoiceNumber,
					randomCode: result.randomCode,
					invoiceDate: result.invoiceDate,
					rawResponse: jsonValue(result.raw),
					failReason: null,
				},
			});
		}
		return client.invoice.create({
			data: {
				provider: providerName,
				status: "ISSUED",
				amount: order.amount,
				order: { connect: { id: orderId } },
				invoiceNumber: result.invoiceNumber,
				randomCode: result.randomCode,
				invoiceDate: result.invoiceDate,
				rawResponse: jsonValue(result.raw),
			},
		});
	} catch (error) {
		return recordFailedInvoice(client, { provider: providerName, amount: order.amount, orderId, failReason: errorMessage(error) }, existing);
	}
}

export async function triggerInvoiceForOrder(orderId: string): Promise<InvoiceRecord | null> {
	return withInvoiceOperationLock(async (tx) => {
		const settings = await getInvoiceSettings();
		if (!settings.einvoiceEnabled || !settings.autoIssueEnabled) return null;

		const provider = await getInvoiceProvider(settings.provider);
		await acquireOrderStateLock(tx, orderId);
		return issueForOrder(tx, orderId, provider, settings.provider);
	});
}

export async function triggerInvoiceForSubscriptionPeriod(
	subscriptionId: string,
	periodNumber: number,
): Promise<InvoiceRecord | null> {
	return withInvoiceOperationLock(async (tx) => {
		const settings = await getInvoiceSettings();
		if (!settings.einvoiceEnabled || !settings.autoIssueEnabled) return null;

		const existing = await tx.invoice.findFirst({ where: { subscriptionId, periodNumber } });
		if (existing) return existing;
		const subscription = await tx.courseSubscription.findUnique({
			where: { id: subscriptionId },
			include: { user: true, plan: { include: { course: true } } },
		});
		if (!subscription) return null;

		const provider = await getInvoiceProvider(settings.provider);
		if (!provider) {
			return createFailedInvoice(tx, {
				provider: settings.provider,
				amount: subscription.pricePerPeriod,
				subscriptionId,
				periodNumber,
				failReason: "電子發票 provider 尚未設定完整",
			});
		}

		try {
			const result = await provider.issue(
				buildIssueInput({
					orderNo: `${subscription.gatewayTradeNo}-${periodNumber}`,
					amount: subscription.pricePerPeriod,
					itemName: subscription.plan.course.title,
					buyerName: subscription.user.name,
					buyerEmail: subscription.user.email,
					preference: invoicePreference(subscription),
					provider: settings.provider,
				}),
			);
			if ("failReason" in result) {
				return createFailedInvoice(tx, {
					provider: settings.provider,
					amount: subscription.pricePerPeriod,
					subscriptionId,
					periodNumber,
					failReason: result.failReason,
				});
			}
			return tx.invoice.create({
				data: {
					provider: settings.provider,
					status: "ISSUED",
					amount: subscription.pricePerPeriod,
					subscription: { connect: { id: subscriptionId } },
					periodNumber,
					invoiceNumber: result.invoiceNumber,
					randomCode: result.randomCode,
					invoiceDate: result.invoiceDate,
					rawResponse: jsonValue(result.raw),
				},
			});
		} catch (error) {
			return createFailedInvoice(tx, {
				provider: settings.provider,
				amount: subscription.pricePerPeriod,
				subscriptionId,
				periodNumber,
				failReason: errorMessage(error),
			});
		}
	});
}

async function refundInvoice(client: Prisma.TransactionClient, invoice: InvoiceRecord, provider: InvoiceProvider | null, now: Date) {
	if (invoice.status !== "ISSUED" || !invoice.invoiceNumber) return invoice;
	if (!provider || !invoice.invoiceDate || !sameTaiwanBillingMonth(invoice.invoiceDate, now)) {
		return client.invoice.update({
			where: { id: invoice.id },
			data: { attentionReason: "REFUND_NEEDS_ALLOWANCE" },
		});
	}
	try {
		const result = await provider.void({ invoiceNumber: invoice.invoiceNumber, reason: "退款", invoiceDate: invoice.invoiceDate });
		return result.success
			? client.invoice.update({ where: { id: invoice.id }, data: { status: "VOIDED", attentionReason: null } })
			: client.invoice.update({ where: { id: invoice.id }, data: { attentionReason: "REFUND_NEEDS_ALLOWANCE", failReason: result.error } });
	} catch (error) {
		return client.invoice.update({
			where: { id: invoice.id },
			data: { attentionReason: "REFUND_NEEDS_ALLOWANCE", failReason: errorMessage(error) },
		});
	}
}

export async function handleRefundInvoice(orderId: string, now = new Date()): Promise<InvoiceRecord | null> {
	return withInvoiceOperationLock(async (tx) => {
		const invoice = await tx.invoice.findUnique({ where: { orderId } });
		if (!invoice) return null;
		const provider = isInvoiceProviderName(invoice.provider) ? await getInvoiceProvider(invoice.provider) : null;
		return refundInvoice(tx, invoice, provider, now);
	});
}

export async function handleRefundInvoiceForSubscription(
	subscriptionId: string,
	now = new Date(),
): Promise<InvoiceRecord | null> {
	return withInvoiceOperationLock(async (tx) => {
		const invoice = await tx.invoice.findFirst({
			where: { subscriptionId, status: "ISSUED" },
			orderBy: { periodNumber: "desc" },
		});
		if (!invoice) return null;
		const provider = isInvoiceProviderName(invoice.provider) ? await getInvoiceProvider(invoice.provider) : null;
		return refundInvoice(tx, invoice, provider, now);
	});
}
