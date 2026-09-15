import { db } from "@startkiter/database";

export type EmailConsentType = "transactional" | "marketing" | "general";
export type UnsubscribeScope = "all" | "marketing" | "general";
export type ConsentKind = "GENERAL" | "MARKETING";
export type ConsentAction = "GRANTED" | "REVOKED";

export type AssertEmailConsentResult = {
	allowed: boolean;
	reason?: string;
};

type ConsentChange = {
	userId: string;
	consentType: ConsentKind;
	action: ConsentAction;
	source: string;
	ip?: string | null;
	market?: string | null;
	termsVersion?: string | null;
	campaignId?: string | null;
};

const userConsentSelect = {
	email: true,
	marketingConsent: true,
	generalEmailConsent: true,
	unsubscribedAt: true,
	emailInvalidAt: true,
	emailBounceState: true,
} as const;

/**
 * The newsletter/business layer owns this gate. Mail providers only deliver
 * an already-authorized message and must not import this module.
 */
export async function assertEmailConsent(
	userId: string,
	type: EmailConsentType,
): Promise<AssertEmailConsentResult> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: userConsentSelect,
	});

	if (!user) return { allowed: false, reason: "user_not_found" };

	if (
		user.emailInvalidAt !== null ||
		user.emailBounceState === "HARD_BOUNCED" ||
		user.emailBounceState === "COMPLAINED"
	) {
		return { allowed: false, reason: "email_invalid_or_complained" };
	}

	if (type === "transactional") return { allowed: true };
	if (user.unsubscribedAt !== null) return { allowed: false, reason: "unsubscribed_all" };

	if (type === "general") {
		return user.generalEmailConsent === true
			? { allowed: true }
			: { allowed: false, reason: "general_unsubscribed" };
	}

	return user.marketingConsent === true
		? { allowed: true }
		: { allowed: false, reason: "marketing_consent_missing" };
}

/**
 * Update one consent field and append its immutable audit event atomically.
 * Callers should use this helper for grants and revocations instead of
 * mutating User consent fields directly.
 */
export async function recordEmailConsent(change: ConsentChange): Promise<void> {
	const user = await db.user.findUnique({
		where: { id: change.userId },
		select: { email: true },
	});
	if (!user) throw new Error("user_not_found");

	const now = new Date();
	const granted = change.action === "GRANTED";
	const data =
		change.consentType === "MARKETING"
			? {
					marketingConsent: granted,
					marketingConsentAt: now,
					marketingConsentSource: change.source,
					marketingConsentIp: change.ip ?? null,
				}
			: { generalEmailConsent: granted, generalEmailConsentAt: now };

	const userUpdate = db.user.update({
		where: { id: change.userId },
		data,
	});
	const auditLog = db.emailConsentLog.create({
		data: {
			userId: change.userId,
			email: user.email,
			consentType: change.consentType,
			action: change.action,
			source: change.source,
			ip: change.ip ?? null,
			market: change.market ?? null,
			termsVersion: change.termsVersion ?? null,
			campaignId: change.campaignId ?? null,
		},
	});

	if (typeof db.$transaction === "function") {
		await db.$transaction([userUpdate, auditLog]);
	} else {
		await Promise.all([userUpdate, auditLog]);
	}
}

export async function applyUnsubscribe(params: {
	userId: string;
	email: string;
	scope: UnsubscribeScope;
	source?: string;
	ip?: string | null;
	campaignId?: string | null;
}): Promise<void> {
	const user = await db.user.findUnique({
		where: { id: params.userId },
		select: { email: true },
	});
	if (!user || user.email.toLowerCase() !== params.email.toLowerCase()) {
		throw new Error("unsubscribe_identity_mismatch");
	}

	const now = new Date();
	const userData =
		params.scope === "all"
			? {
					generalEmailConsent: false,
					marketingConsent: false,
					marketingConsentAt: now,
					marketingConsentSource: params.source ?? "unsubscribe_page",
					marketingConsentIp: params.ip ?? null,
					unsubscribedAt: now,
				}
			: params.scope === "marketing"
				? {
						marketingConsent: false,
						marketingConsentAt: now,
						marketingConsentSource: params.source ?? "unsubscribe_page",
						marketingConsentIp: params.ip ?? null,
					}
				: { generalEmailConsent: false, generalEmailConsentAt: now };
	const consentTypes: ConsentKind[] =
		params.scope === "all"
			? ["GENERAL", "MARKETING"]
			: [params.scope === "marketing" ? "MARKETING" : "GENERAL"];

	const userUpdate = db.user.update({ where: { id: params.userId }, data: userData });
	const logs = consentTypes.map((consentType) =>
		db.emailConsentLog.create({
			data: {
				userId: params.userId,
				email: user.email,
				consentType,
				action: "REVOKED",
				source: params.source ?? "unsubscribe_page",
				ip: params.ip ?? null,
				campaignId: params.campaignId ?? null,
			},
		}),
	);

	if (typeof db.$transaction === "function") {
		await db.$transaction([userUpdate, ...logs]);
	} else {
		await Promise.all([userUpdate, ...logs]);
	}
}
