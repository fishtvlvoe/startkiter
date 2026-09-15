import { db } from "@startkiter/database";

import type { UnsubscribeScope } from "./unsubscribe-token";

export type ConsentEmailType = "transactional" | "general" | "marketing";

export interface ConsentResult {
	allowed: boolean;
	reason?: string;
}

export type RecordMarketingConsentParams = {
	userId: string;
	source: "checkout" | "register";
	granted: boolean;
	ip?: string | null;
};

/**
 * 寄信前的統一同意守門。放在業務層呼叫，不得搬進 packages/mail provider。
 */
export async function assertEmailConsent(
	userId: string,
	type: ConsentEmailType,
): Promise<ConsentResult> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			email: true,
			marketingConsent: true,
			generalEmailConsent: true,
			unsubscribedAt: true,
			emailInvalidAt: true,
			emailBounceState: true,
		},
	});

	if (!user) return { allowed: false, reason: "user_not_found" };

	if (user.emailBounceState === "HARD_BOUNCED" || user.emailBounceState === "COMPLAINED") {
		return { allowed: false, reason: "email_invalid_or_complained" };
	}

	if (user.emailInvalidAt) {
		return { allowed: false, reason: "email_invalid_or_complained" };
	}

	if (type === "transactional") return { allowed: true };

	if (user.unsubscribedAt) {
		return { allowed: false, reason: "unsubscribed_all" };
	}

	if (type === "general") {
		return user.generalEmailConsent === true
			? { allowed: true }
			: { allowed: false, reason: "general_unsubscribed" };
	}

	if (type === "marketing") {
		return user.marketingConsent === true
			? { allowed: true }
			: { allowed: false, reason: "marketing_consent_missing" };
	}

	return { allowed: false, reason: "unknown_type" };
}

/** 結帳／註冊勾選行銷同意時寫入 User + 不可變 EmailConsentLog。 */
export async function recordMarketingConsent(
	params: RecordMarketingConsentParams,
): Promise<void> {
	const user = await db.user.findUnique({
		where: { id: params.userId },
		select: { email: true },
	});
	if (!user?.email) {
		throw new Error("user_not_found");
	}

	const now = new Date();
	await db.$transaction([
		db.user.update({
			where: { id: params.userId },
			data: params.granted
				? {
						marketingConsent: true,
						marketingConsentAt: now,
						marketingConsentSource: params.source,
						marketingConsentIp: params.ip ?? null,
					}
				: {
						marketingConsent: false,
						marketingConsentAt: now,
						marketingConsentSource: params.source,
						marketingConsentIp: params.ip ?? null,
					},
		}),
		db.emailConsentLog.create({
			data: {
				userId: params.userId,
				email: user.email.toLowerCase(),
				consentType: "MARKETING",
				action: params.granted ? "GRANTED" : "REVOKED",
				source: params.source,
				ip: params.ip ?? null,
			},
		}),
	]);
}

export async function applyUnsubscribe(params: {
	userId: string;
	email: string;
	scope: UnsubscribeScope;
	source?: string;
	ip?: string | null;
	campaignId?: string | null;
}): Promise<void> {
	const now = new Date();
	const data =
		params.scope === "all"
			? {
					unsubscribedAt: now,
					generalEmailConsent: false,
					marketingConsent: false,
				}
			: params.scope === "marketing"
				? { marketingConsent: false }
				: { generalEmailConsent: false };

	await db.$transaction([
		db.user.update({
			where: { id: params.userId },
			data,
		}),
		db.emailConsentLog.create({
			data: {
				userId: params.userId,
				email: params.email.toLowerCase(),
				consentType: params.scope === "general" ? "GENERAL" : "MARKETING",
				action: "REVOKED",
				source: params.source || "unsubscribe_page",
				ip: params.ip || null,
				campaignId: params.campaignId || null,
			},
		}),
		...(params.campaignId
			? [
					db.newsletterCampaign.update({
						where: { id: params.campaignId },
						data: { unsubCount: { increment: 1 } },
					}),
				]
			: []),
	]);
}
