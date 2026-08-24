import { buildIssueInput, type InvoiceProvider } from "@startkiter/payments";
import { db, type Prisma } from "@startkiter/database";

import { getInvoiceProvider, getInvoiceSettings } from "./invoice-settings";

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

async function createFailedInvoice(args: {
	provider: "ecpay" | "ezpay";
	amount: number;
	orderId?: string;
	subscriptionId?: string;
	periodNumber?: number;
	failReason: string;
}): Promise<InvoiceRecord> {
	return db.invoice.create({
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

async function issueForOrder(orderId: string, provider: InvoiceProvider, providerName: "ecpay" | "ezpay") {
	const order = await db.order.findUnique({
		where: { id: orderId },
		include: { user: true },
	});
	if (!order) return null;

	const existing = await db.invoice.findUnique({ where: { orderId } });
	if (existing) return existing;

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
			return createFailedInvoice({ provider: providerName, amount: order.amount, orderId, failReason: result.failReason });
		}
		return db.invoice.create({
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
		return createFailedInvoice({ provider: providerName, amount: order.amount, orderId, failReason: errorMessage(error) });
	}
}

export async function triggerInvoiceForOrder(orderId: string): Promise<InvoiceRecord | null> {
	const settings = await getInvoiceSettings();
	if (!settings.einvoiceEnabled || !settings.autoIssueEnabled) return null;

	const provider = await getInvoiceProvider();
	if (!provider) {
		const order = await db.order.findUnique({ where: { id: orderId }, select: { amount: true } });
		return order
			? createFailedInvoice({
					provider: settings.provider,
					amount: order.amount,
					orderId,
					failReason: "電子發票 provider 尚未設定完整",
				})
			: null;
	}
	return issueForOrder(orderId, provider, settings.provider);
}

export async function triggerInvoiceForSubscriptionPeriod(
	subscriptionId: string,
	periodNumber: number,
): Promise<InvoiceRecord | null> {
	const settings = await getInvoiceSettings();
	if (!settings.einvoiceEnabled || !settings.autoIssueEnabled) return null;

	const existing = await db.invoice.findFirst({ where: { subscriptionId, periodNumber } });
	if (existing) return existing;
	const subscription = await db.courseSubscription.findUnique({
		where: { id: subscriptionId },
		include: { user: true, plan: { include: { course: true } } },
	});
	if (!subscription) return null;

	const provider = await getInvoiceProvider();
	if (!provider) {
		return createFailedInvoice({
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
			return createFailedInvoice({
				provider: settings.provider,
				amount: subscription.pricePerPeriod,
				subscriptionId,
				periodNumber,
				failReason: result.failReason,
			});
		}
		return db.invoice.create({
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
		return createFailedInvoice({
			provider: settings.provider,
			amount: subscription.pricePerPeriod,
			subscriptionId,
			periodNumber,
			failReason: errorMessage(error),
		});
	}
}

function sameTaiwanBillingMonth(a: Date, b: Date): boolean {
	const parts = (date: Date) => {
		const values = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit" }).formatToParts(date);
		return `${values.find((part) => part.type === "year")?.value}-${values.find((part) => part.type === "month")?.value}`;
	};
	return parts(a) === parts(b);
}

async function refundInvoice(invoice: InvoiceRecord, provider: InvoiceProvider | null, now: Date) {
	if (invoice.status !== "ISSUED" || !invoice.invoiceNumber) return invoice;
	if (!provider || !invoice.invoiceDate || !sameTaiwanBillingMonth(invoice.invoiceDate, now)) {
		return db.invoice.update({
			where: { id: invoice.id },
			data: { attentionReason: "REFUND_NEEDS_ALLOWANCE" },
		});
	}
	const result = await provider.void({ invoiceNumber: invoice.invoiceNumber, reason: "退款" });
	return result.success
		? db.invoice.update({ where: { id: invoice.id }, data: { status: "VOIDED", attentionReason: null } })
		: db.invoice.update({ where: { id: invoice.id }, data: { attentionReason: "REFUND_NEEDS_ALLOWANCE", failReason: result.error } });
}

export async function handleRefundInvoice(orderId: string, now = new Date()): Promise<InvoiceRecord | null> {
	const invoice = await db.invoice.findUnique({ where: { orderId } });
	if (!invoice) return null;
	const provider = await getInvoiceProvider();
	return refundInvoice(invoice, provider, now);
}

export async function handleRefundInvoiceForSubscription(
	subscriptionId: string,
	now = new Date(),
): Promise<InvoiceRecord | null> {
	const invoice = await db.invoice.findFirst({
		where: { subscriptionId, status: "ISSUED" },
		orderBy: { periodNumber: "desc" },
	});
	if (!invoice) return null;
	const provider = await getInvoiceProvider();
	return refundInvoice(invoice, provider, now);
}
