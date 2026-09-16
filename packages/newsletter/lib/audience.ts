import type { Prisma } from "@startkiter/database";

export type NewsletterAudienceType = "GENERAL" | "PROMO";

export type SegmentRuleField =
	| "all"
	| "coursePurchased"
	| "courseNotPurchased"
	| "role"
	| "lastLoginWithinDays"
	| "lastLoginBeforeDays"
	| "createdAfter"
	| "createdBefore"
	| "marketingConsent";

export type SegmentRule = {
	field: SegmentRuleField;
	value?: string | number | boolean;
};

export type SegmentAudienceItem =
	| { type: "all"; id: "all"; label?: string }
	| { type: "course"; id: string; label?: string }
	| { type: "noCourse"; id: "noCourse"; label?: string }
	| { type: "user"; id: string; email?: string; label?: string }
	| { type: "email"; id: string; email: string; label?: string };

export type SegmentJson = {
	mode?: "AND" | "OR";
	preset?: "all" | "paidStudents" | "freeStudents" | "courseStudents" | "manual";
	rules?: SegmentRule[];
	manualUserIds?: string[];
	manualEmails?: string[];
	courseIds?: string[];
	include?: SegmentAudienceItem[];
	exclude?: SegmentAudienceItem[];
};

export type AudienceUserRow = {
	id: string;
	name: string | null;
	email: string;
	role: string | null;
	marketingConsent: boolean | null;
	generalEmailConsent: boolean;
	unsubscribedAt: Date | null;
	emailInvalidAt: Date | null;
	emailBounceState: string;
	createdAt: Date;
};

export type AudienceRecipient = {
	id: string;
	name: string | null;
	email: string;
	source: "user" | "external";
};

export type AudienceEstimate = {
	matched: number;
	excluded: {
		unsubscribed: number;
		invalid: number;
		marketingMissing: number;
	};
	sendable: number;
	samples: Array<{ id: string; name: string | null; emailMasked: string }>;
	recipients?: AudienceRecipient[];
};

export type FindAudienceUsers = (args: {
	where: Prisma.UserWhereInput;
	take?: number;
}) => Promise<AudienceUserRow[]>;

const audienceSelect = {
	id: true,
	name: true,
	email: true,
	role: true,
	marketingConsent: true,
	generalEmailConsent: true,
	unsubscribedAt: true,
	emailInvalidAt: true,
	emailBounceState: true,
	createdAt: true,
} as const;

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function maskEmail(email: string): string {
	const normalized = normalizeEmail(email);
	const [local, domain] = normalized.split("@");
	if (!local || !domain) return "***";
	const visible = local.slice(0, Math.min(2, local.length));
	return `${visible}***@${domain}`;
}

export function parseSegmentJson(value: unknown): SegmentJson {
	if (!value || typeof value !== "object") {
		return { preset: "all", mode: "AND", rules: [] };
	}
	return value as SegmentJson;
}

function daysAgo(days: number, now = new Date()): Date {
	return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function ruleWhere(rule: SegmentRule, now = new Date()): Prisma.UserWhereInput {
	switch (rule.field) {
		case "all":
			return {};
		case "coursePurchased":
			return {
				courseSubscriptions: {
					some: { courseId: String(rule.value), status: "ACTIVE" },
				},
			};
		case "courseNotPurchased":
			return {
				courseSubscriptions: {
					none: { courseId: String(rule.value), status: "ACTIVE" },
				},
			};
		case "role":
			return { role: String(rule.value) };
		case "lastLoginWithinDays":
			return {
				sessions: {
					some: { updatedAt: { gte: daysAgo(Number(rule.value || 0), now) } },
				},
			};
		case "lastLoginBeforeDays":
			return {
				OR: [
					{
						sessions: {
							every: { updatedAt: { lt: daysAgo(Number(rule.value || 0), now) } },
						},
					},
					{ sessions: { none: {} } },
				],
			};
		case "createdAfter":
			return { createdAt: { gte: new Date(String(rule.value)) } };
		case "createdBefore":
			return { createdAt: { lte: new Date(String(rule.value)) } };
		case "marketingConsent":
			return { marketingConsent: rule.value === true };
		default:
			return {};
	}
}

function manualEmails(segment: SegmentJson | null | undefined): string[] {
	const legacy = segment?.manualEmails || [];
	const includeEmails = (segment?.include || [])
		.filter((item): item is Extract<SegmentAudienceItem, { type: "email" }> => item.type === "email")
		.map((item) => item.email);
	return [
		...new Set(
			[...legacy, ...includeEmails]
				.map(normalizeEmail)
				.filter((email) => email.includes("@")),
		),
	];
}

/**
 * Single-layer AND/OR only — never nests condition groups.
 */
export function buildAudienceWhere(
	segment: SegmentJson | null | undefined,
	now = new Date(),
): Prisma.UserWhereInput {
	if (!segment || segment.preset === "all") {
		if (!segment?.rules?.length) return {};
	}

	if (segment.preset === "manual") {
		const ids = segment.manualUserIds || [];
		const emails = manualEmails(segment);
		if (!ids.length && !emails.length) return { id: { in: [] } };
		if (ids.length && !emails.length) return { id: { in: ids } };
		if (!ids.length && emails.length) {
			return { email: { in: emails, mode: "insensitive" } };
		}
		return {
			OR: [{ id: { in: ids } }, { email: { in: emails, mode: "insensitive" } }],
		};
	}

	if (segment.preset === "courseStudents" && segment.courseIds?.length) {
		return {
			courseSubscriptions: {
				some: { courseId: { in: segment.courseIds }, status: "ACTIVE" },
			},
		};
	}

	if (segment.include?.length) {
		if (segment.include.some((item) => item.type === "all")) return {};
		const clauses = segment.include
			.map((item): Prisma.UserWhereInput | null => {
				if (item.type === "course") {
					return {
						courseSubscriptions: {
							some: { courseId: item.id, status: "ACTIVE" },
						},
					};
				}
				if (item.type === "noCourse") {
					return {
						courseSubscriptions: { none: { status: "ACTIVE" } },
					};
				}
				if (item.type === "user") return { id: item.id };
				if (item.type === "email") {
					return { email: { equals: normalizeEmail(item.email), mode: "insensitive" } };
				}
				return null;
			})
			.filter((clause): clause is Prisma.UserWhereInput => clause !== null);
		if (!clauses.length) return { id: { in: [] } };
		return clauses.length === 1 ? clauses[0]! : { OR: clauses };
	}

	const rules = segment.rules || [];
	const clauses = rules
		.map((rule) => ruleWhere(rule, now))
		.filter((clause) => Object.keys(clause).length > 0);

	if (!clauses.length) return {};
	if (clauses.length === 1) return clauses[0]!;
	return segment.mode === "OR" ? { OR: clauses } : { AND: clauses };
}

export function countSelectedRecipients(segment: SegmentJson): number {
	if (segment.preset === "manual") {
		const ids = new Set(segment.manualUserIds || []);
		for (const email of manualEmails(segment)) ids.add(email);
		return ids.size;
	}
	return 0;
}

function mergeWhere(...clauses: Prisma.UserWhereInput[]): Prisma.UserWhereInput {
	const active = clauses.filter((clause) => Object.keys(clause).length > 0);
	if (active.length === 0) return {};
	if (active.length === 1) return active[0]!;
	return { AND: active };
}

async function defaultFindAudienceUsers(args: {
	where: Prisma.UserWhereInput;
	take?: number;
}): Promise<AudienceUserRow[]> {
	const { db } = await import("@startkiter/database");
	return db.user.findMany({
		where: args.where,
		select: audienceSelect,
		orderBy: { createdAt: "desc" },
		take: args.take,
	});
}

export function dedupeByEmail(users: AudienceUserRow[]): AudienceUserRow[] {
	const deduped = new Map<string, AudienceUserRow>();
	for (const user of users) {
		const email = normalizeEmail(user.email);
		if (!email || deduped.has(email)) continue;
		deduped.set(email, { ...user, email });
	}
	return [...deduped.values()];
}

function isInvalid(user: AudienceUserRow): boolean {
	return (
		user.emailInvalidAt !== null ||
		user.emailBounceState === "HARD_BOUNCED" ||
		user.emailBounceState === "COMPLAINED"
	);
}

function classifyRecipient(
	user: AudienceUserRow,
	type: NewsletterAudienceType,
): "sendable" | "unsubscribed" | "invalid" | "marketingMissing" {
	if (isInvalid(user)) return "invalid";
	if (user.unsubscribedAt !== null) return "unsubscribed";

	if (type === "PROMO") {
		return user.marketingConsent === true ? "sendable" : "marketingMissing";
	}

	return user.generalEmailConsent === true ? "sendable" : "unsubscribed";
}

export async function getAudienceUsers(params: {
	type: NewsletterAudienceType;
	segment: SegmentJson;
	limit?: number;
	findUsers?: FindAudienceUsers;
	now?: Date;
}): Promise<AudienceUserRow[]> {
	const findUsers = params.findUsers ?? defaultFindAudienceUsers;
	const baseWhere = buildAudienceWhere(params.segment, params.now);
	const where = mergeWhere(baseWhere, {
		email: { not: "" },
	});

	const users = await findUsers({
		where,
		take: params.limit ?? 50_000,
	});

	return dedupeByEmail(users);
}

export async function estimateAudience(params: {
	type: NewsletterAudienceType;
	segment: SegmentJson;
	limit?: number;
	findUsers?: FindAudienceUsers;
	now?: Date;
}): Promise<AudienceEstimate> {
	const users = await getAudienceUsers(params);
	let unsubscribed = 0;
	let invalid = 0;
	let marketingMissing = 0;
	const sendable: AudienceUserRow[] = [];

	for (const user of users) {
		const bucket = classifyRecipient(user, params.type);
		if (bucket === "sendable") {
			sendable.push(user);
			continue;
		}
		if (bucket === "invalid") {
			invalid++;
			continue;
		}
		if (bucket === "marketingMissing") {
			marketingMissing++;
			continue;
		}
		unsubscribed++;
	}

	return {
		matched: users.length,
		excluded: { unsubscribed, invalid, marketingMissing },
		sendable: sendable.length,
		samples: sendable.slice(0, 5).map((user) => ({
			id: user.id,
			name: user.name,
			emailMasked: maskEmail(user.email),
		})),
		recipients: sendable.map((user) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			source: "user" as const,
		})),
	};
}

/**
 * Always re-query live user state. Callers must not pass a creation-time snapshot.
 */
export async function resolveDispatchRecipients(params: {
	type: NewsletterAudienceType;
	segment: SegmentJson;
	limit?: number;
	findUsers?: FindAudienceUsers;
	now?: Date;
}): Promise<AudienceRecipient[]> {
	const estimate = await estimateAudience(params);
	return estimate.recipients ?? [];
}

export function createDebouncedAudienceEstimator<TArgs, TResult>(
	run: (args: TArgs) => Promise<TResult>,
	delayMs: number,
): (args: TArgs) => Promise<TResult> {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let pending: {
		args: TArgs;
		resolve: (value: TResult) => void;
		reject: (reason?: unknown) => void;
	} | null = null;

	return (args: TArgs) =>
		new Promise<TResult>((resolve, reject) => {
			if (timer) clearTimeout(timer);
			pending = { args, resolve, reject };
			timer = setTimeout(() => {
				const current = pending;
				pending = null;
				timer = null;
				if (!current) return;
				void run(current.args).then(current.resolve, current.reject);
			}, delayMs);
		});
}

export class PromoAudienceLockError extends Error {
	readonly code = "promo_marketing_consent_required";

	constructor(message = "Promotional campaigns require a marketingConsent=true audience filter.") {
		super(message);
		this.name = "PromoAudienceLockError";
	}
}

export function segmentHasMarketingConsentLock(segment: SegmentJson): boolean {
	return (segment.rules || []).some(
		(rule) => rule.field === "marketingConsent" && rule.value === true,
	);
}

export function enforcePromoAudienceSegment(segment: SegmentJson): SegmentJson {
	if (segmentHasMarketingConsentLock(segment)) return segment;
	return {
		...segment,
		mode: segment.mode ?? "AND",
		rules: [...(segment.rules || []), { field: "marketingConsent", value: true }],
	};
}
