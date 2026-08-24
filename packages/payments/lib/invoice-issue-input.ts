import { createHash } from "node:crypto";

import {
	CarrierType,
	PriceMode,
	splitTaxInclusive,
	TaxType,
	type AllowanceInput,
	type IssueInvoiceInput,
} from "@paid-tw/einvoice";

export interface OrderInvoicePreference {
	invoiceType: "PERSONAL" | "COMPANY" | "DONATION" | null;
	carrierType: string | null;
	carrierId: string | null;
	taxId: string | null;
	title: string | null;
	loveCode: string | null;
	address: string | null;
}

export interface BuildIssueParams {
	orderNo: string;
	amount: number;
	itemName: string;
	buyerName?: string | null;
	buyerEmail?: string | null;
	preference: OrderInvoicePreference;
	provider?: "ecpay" | "ezpay";
}

const ITEM_NAME_LIMITS = { ecpay: 500, ezpay: 30 } as const;
const EZPAY_MAX_ORDER_ID_LENGTH = 20;

export function normalizeItemName(name: string, provider: "ecpay" | "ezpay"): string {
	const trimmed = (name || "商品").trim();
	return trimmed.length > ITEM_NAME_LIMITS[provider] ? trimmed.slice(0, ITEM_NAME_LIMITS[provider]) : trimmed;
}

export function normalizeBuyerName(
	name: string | null | undefined,
	provider: "ecpay" | "ezpay",
	isCompany: boolean,
): string | undefined {
	const value = name?.trim();
	if (!value) return undefined;
	const maxLength = provider === "ezpay" && !isCompany ? 30 : 60;
	return value.slice(0, maxLength);
}

export function normalizeProviderOrderId(orderNo: string, provider?: "ecpay" | "ezpay"): string {
	const normalized = orderNo.trim();
	if (provider !== "ezpay" || normalized.length <= EZPAY_MAX_ORDER_ID_LENGTH) return normalized;
	return `EZ${createHash("sha256").update(normalized).digest("hex").slice(0, 18)}`;
}

export function buildIssueInput(params: BuildIssueParams): IssueInvoiceInput {
	const provider = params.provider ?? "ecpay";
	const summary = splitTaxInclusive(params.amount);
	const preference = params.preference;
	const isCompany = preference.invoiceType === "COMPANY" && Boolean(preference.taxId);
	const buyerEmail = params.buyerEmail?.trim() || undefined;
	const itemName = normalizeItemName(params.itemName, provider);
	const providerOrderId = normalizeProviderOrderId(params.orderNo, provider);

	if (provider === "ezpay" && buyerEmail && buyerEmail.length > 50) {
		throw new Error("ezPay 買受人 Email 不可超過 50 個字元");
	}

	const taxExclusiveItems = provider === "ezpay" && isCompany;
	const lineAmount = taxExclusiveItems ? summary.salesAmount : params.amount;
	const input: IssueInvoiceInput = {
		orderId: providerOrderId,
		buyer: {
			name: isCompany
				? normalizeBuyerName(preference.title, provider, true)
				: normalizeBuyerName(params.buyerName, provider, false),
			ubn: isCompany ? preference.taxId ?? undefined : undefined,
			email: buyerEmail,
			address: preference.address?.trim() || undefined,
		},
		items: [{ description: itemName, quantity: 1, unitPrice: lineAmount, amount: lineAmount }],
		amount: summary,
		taxType: TaxType.TAXABLE,
		priceMode: taxExclusiveItems ? PriceMode.TAX_EXCLUSIVE : PriceMode.TAX_INCLUSIVE,
		providerOptions: provider === "ezpay" ? { MerchantOrderNo: providerOrderId } : undefined,
	};

	if (preference.invoiceType === "DONATION" && preference.loveCode) {
		input.donation = { npoban: preference.loveCode.trim() };
	} else if (preference.invoiceType === "PERSONAL") {
		if (preference.carrierType === "mobile" && preference.carrierId) {
			input.carrier = { type: CarrierType.MOBILE_BARCODE, code: preference.carrierId.trim() };
		} else {
			if (!buyerEmail) throw new Error("個人會員載具必須有買受人 Email");
			input.carrier = {
				type: CarrierType.MEMBER,
				code: provider === "ezpay" ? buyerEmail : undefined,
			};
		}
	}

	return input;
}

export function buildAllowanceInput(params: {
	provider: "ecpay" | "ezpay";
	invoiceNumber: string;
	allowanceId: string;
	originalOrderId: string;
	amount: number;
	itemName: string;
	invoiceDate?: Date | null;
	buyerEmail?: string | null;
	taxExclusive?: boolean;
}): AllowanceInput {
	const amount = splitTaxInclusive(params.amount);
	const taxExclusiveItems = params.provider === "ezpay" && params.taxExclusive === true;
	const lineAmount = taxExclusiveItems ? amount.salesAmount : params.amount;
	return {
		invoiceNumber: params.invoiceNumber,
		allowanceId: params.allowanceId,
		items: [
			{
				description: normalizeItemName(params.itemName, params.provider),
				quantity: 1,
				unitPrice: lineAmount,
				amount: lineAmount,
			},
		],
		amount,
		date: params.invoiceDate ?? undefined,
		providerOptions:
				params.provider === "ezpay"
					? {
							merchantOrderNo: params.originalOrderId,
							taxRate: taxExclusiveItems ? 0.05 : 0,
							buyerEmail: params.buyerEmail?.trim() || undefined,
						}
					: undefined,
	};
}
