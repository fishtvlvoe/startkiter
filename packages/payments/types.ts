export interface BasePrice {
	/**
	 * Price amount in major currency units, for example `29` for USD 29.00.
	 */
	amount: number;
	/**
	 * ISO currency code charged for this price.
	 */
	currency: string;
	/**
	 * Provider-specific price identifier. In client bundles this may be
	 * unavailable because env-backed values are stripped by Next.js.
	 */
	priceId?: string;
}

export interface SubscriptionPrice {
	/**
	 * Marks the price as a subscription charge.
	 */
	type: "subscription";
	/**
	 * Billing cadence for the subscription.
	 */
	interval: "month" | "year";
	/**
	 * Indicates whether the subscription scales with seat count.
	 */
	seatBased?: boolean;
	/**
	 * Optional number of free trial days before billing starts.
	 */
	trialPeriodDays?: number;
}

export interface OneTimePrice {
	/**
	 * Marks the price as a one-time purchase.
	 */
	type: "one-time";
}

export type PlanPrice = (BasePrice & SubscriptionPrice) | (BasePrice & OneTimePrice);

export interface PaidPlan {
	/**
	 * Purchasable prices offered for the plan.
	 */
	prices: PlanPrice[];
	/**
	 * Highlights the plan in pricing tables and comparison views.
	 */
	recommended?: boolean;
	/**
	 * Keeps the plan available in configuration while hiding it from standard UI.
	 */
	hidden?: boolean;
}

export interface EnterprisePlan {
	/**
	 * Marks the plan as sales-led rather than directly purchasable.
	 */
	isEnterprise: true;
	/**
	 * Highlights the plan in pricing tables and comparison views.
	 */
	recommended?: boolean;
	/**
	 * Keeps the plan available in configuration while hiding it from standard UI.
	 */
	hidden?: boolean;
}

export type Plan = PaidPlan | EnterprisePlan;

export interface PaymentsConfig {
	/**
	 * Determines whether subscriptions are owned by individual users or by
	 * organizations.
	 */
	billingAttachedTo: "user" | "organization";
	/**
	 * Forces users to hold an active subscription before accessing paid areas.
	 */
	requireActiveSubscription: boolean;
	/**
	 * Catalog of plans exposed to checkout, pricing pages, and billing logic.
	 */
	plans: Record<string, Plan>;
}

export type CreateCheckoutLink = (params: {
	type: "subscription" | "one-time";
	priceId: string;
	email?: string;
	name?: string;
	redirectUrl?: string;
	customerId?: string;
	organizationId?: string;
	userId?: string;
	trialPeriodDays?: number;
	seats?: number;
}) => Promise<string | null>;

export type CreateCustomerPortalLink = (params: {
	subscriptionId?: string;
	customerId: string;
	redirectUrl?: string;
}) => Promise<string | null>;

export type SetSubscriptionSeats = (params: { id: string; seats: number }) => Promise<void>;

export type CancelSubscription = (id: string) => Promise<void>;

export type SubscriptionInterval = "MONTH" | "YEAR";

export type SubscriptionSessionResult = {
	type: "form_post";
	formData: {
		apiUrl: string;
		MerID: string;
		Version: string;
		EncryptInfo: string;
		HashInfo: string;
	};
	gatewaySessionId: string;
};

/** Provider-neutral contract for recurring billing. */
export interface SubscriptionGateway {
	createSubscriptionSession(params: {
		subscriptionId: string;
		gatewayTradeNo: string;
		pricePerPeriod: number;
		interval: SubscriptionInterval;
		courseTitle: string;
		baseUrl: string;
		payerEmail?: string;
	}): Promise<SubscriptionSessionResult>;
	cancelSubscription(params: {
		gatewaySubscriptionId: string;
	}): Promise<{ success: boolean; error?: string }>;
	queryPeriod(gatewaySubscriptionId: string): Promise<{
		status: string;
		totalTimes: number;
		alreadyTimes: number;
	}>;
}

export type InvoiceProviderConfig = {
	merchantId: string;
	hashKey: string;
	hashIV: string;
	testMode: boolean;
	timeoutMs?: number;
};

export interface InvoiceProvider {
	issue(input: IssueInvoiceInput): Promise<
		| { invoiceNumber: string; randomCode: string; invoiceDate: Date; raw?: unknown }
		| { failReason: string }
	>;
	void(params: { invoiceNumber: string; reason: string }): Promise<{ success: boolean; error?: string }>;
	allowance(params: {
		invoiceNumber: string;
		amount: number;
		allowanceId?: string;
		itemName?: string;
		originalOrderId?: string;
		buyerEmail?: string | null;
		taxExclusive?: boolean;
	}): Promise<{ success: boolean; allowanceNumber?: string; error?: string }>;
}

export type WebhookHandler = (req: Request) => Promise<Response>;

export type PaymentProvider = {
	createCheckoutLink: CreateCheckoutLink;
	createCustomerPortalLink: CreateCustomerPortalLink;
	webhookHandler: WebhookHandler;
};
import type { IssueInvoiceInput } from "@paid-tw/einvoice";
