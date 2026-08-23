import type {
	SubscriptionGateway,
	SubscriptionInterval,
	SubscriptionSessionResult,
} from "../../types";
import { PayUniService } from "./crypto";
import type { PayUniCredentials } from "./gateway";

const UNLIMITED_PERIOD_TIMES = 900;

function taipeiDateParts(date: Date): Record<string, string> {
	return Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone: "Asia/Taipei",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(date)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value]),
	);
}

function periodDate(interval: SubscriptionInterval, now = new Date()): string {
	const parts = taipeiDateParts(now);
	if (interval === "MONTH") {
		return String(Number(parts.day));
	}
	return `${Number(parts.year) + 1}-${parts.month}-${parts.day}`;
}

function periodEndpoint(apiUrl: string, endpoint: "Page" | "mdfStatus" | "query"): string {
	try {
		const url = new URL(apiUrl);
		url.pathname = url.pathname.replace(/\/api\/upp\/?$/, `/api/period/${endpoint}`);
		return url.toString();
	} catch {
		return apiUrl.replace(/\/api\/upp\/?$/, `/api/period/${endpoint}`);
	}
}

function integerField(value: unknown): number {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export class PayUniPeriodGateway implements SubscriptionGateway {
	private readonly service: PayUniService;

	constructor(private readonly credentials: PayUniCredentials) {
		this.service = new PayUniService(credentials);
	}

	async createSubscriptionSession(params: {
		subscriptionId: string;
		gatewayTradeNo: string;
		pricePerPeriod: number;
		interval: SubscriptionInterval;
		courseTitle: string;
		baseUrl: string;
		payerEmail?: string;
	}): Promise<SubscriptionSessionResult> {
		const form = this.service.createFormData({
			MerTradeNo: params.gatewayTradeNo,
			PeriodAmt: Math.round(params.pricePerPeriod),
			ProdDesc: params.courseTitle.slice(0, 500),
			PeriodType: params.interval === "YEAR" ? "year" : "month",
			PeriodDate: periodDate(params.interval),
			PeriodTimes: UNLIMITED_PERIOD_TIMES,
			FType: "build",
			API3D: 1,
			NotifyURL: `${params.baseUrl}/api/payuni/period-notify`,
			ReturnURL: `${params.baseUrl}/checkout-return?subscriptionId=${encodeURIComponent(params.subscriptionId)}`,
			...(params.payerEmail ? { PayerEmail: params.payerEmail } : {}),
		});

		return {
			type: "form_post",
			formData: {
				apiUrl: periodEndpoint(this.credentials.apiUrl, "Page"),
				MerID: form.MerID,
				Version: form.Version,
				EncryptInfo: form.EncryptInfo,
				HashInfo: form.HashInfo,
			},
			gatewaySessionId: params.gatewayTradeNo,
		};
	}

	async cancelSubscription(params: { gatewaySubscriptionId: string }): Promise<{ success: boolean; error?: string }> {
		if (!params.gatewaySubscriptionId.trim()) {
			return { success: true };
		}

		try {
			const response = await this.service.requestApi(periodEndpoint(this.credentials.apiUrl, "mdfStatus"), {
				PeriodTradeNo: params.gatewaySubscriptionId,
				ReviseTradeStatus: "end",
			});
			if (response.Status === "SUCCESS" || response.Status === "PMDF02013") {
				return { success: true };
			}
			return { success: false, error: response.Message || `PAYUNi cancellation failed (${response.Status})` };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : "PAYUNi cancellation failed" };
		}
	}

	async queryPeriod(gatewaySubscriptionId: string): Promise<{
		status: string;
		totalTimes: number;
		alreadyTimes: number;
	}> {
		const response = await this.service.requestApi(periodEndpoint(this.credentials.apiUrl, "query"), {
			PeriodTradeNo: gatewaySubscriptionId,
		});
		return {
			status: String(response.Status ?? ""),
			totalTimes: integerField(response.TotalTimes),
			alreadyTimes: integerField(response.AlreadyTimes),
		};
	}
}
