import { db, type Prisma } from "@startkiter/database";
import { sendEmail as defaultSendEmail } from "@startkiter/mail";

import {
	assertEmailConsent as defaultAssertEmailConsent,
	type AssertEmailConsentResult,
	type EmailConsentType,
} from "./email-consent";

export const BATCH_SIZE = 500;

const RATE_WINDOW_MS = 60_000;

const TERMINAL_STATUSES = new Set(["SENT", "PARTIAL_FAILED", "FAILED", "CANCELLED"]);

const NON_TERMINAL_STATUSES = [
	"DRAFT",
	"SCHEDULED",
	"QUEUED",
	"SENDING",
	"PAUSED",
] as const;

export type CampaignStatus =
	| "DRAFT"
	| "SCHEDULED"
	| "QUEUED"
	| "SENDING"
	| "PAUSED"
	| "SENT"
	| "PARTIAL_FAILED"
	| "FAILED"
	| "CANCELLED";

export type AssertEmailConsentFn = (
	userId: string,
	type: EmailConsentType,
) => Promise<AssertEmailConsentResult>;

export type SenderSnapshot = {
	provider: string | null;
	mailFrom: string | null;
	capturedAt: string;
	[key: string]: unknown;
};

export type DispatchBatchOptions = {
	batchSize?: number;
	now?: Date;
	assertEmailConsent?: AssertEmailConsentFn;
	sendEmail?: typeof defaultSendEmail;
	captureSenderSnapshot?: () => Promise<SenderSnapshot | Record<string, unknown>>;
};

export type DispatchBatchResult = {
	sent: number;
	skipped: number;
	failed: number;
	rateLimited: boolean;
	completed: boolean;
};

export class CampaignStateError extends Error {
	constructor(
		message: string,
		readonly code: string,
	) {
		super(message);
		this.name = "CampaignStateError";
	}
}

function asStatusList(expected: CampaignStatus | CampaignStatus[]) {
	return Array.isArray(expected) ? expected : [expected];
}

async function loadCampaign(campaignId: string) {
	const campaign = await db.newsletterCampaign.findUnique({ where: { id: campaignId } });
	if (!campaign) {
		throw new CampaignStateError(`Campaign ${campaignId} not found`, "NOT_FOUND");
	}

	return campaign;
}

function assertNotTerminal(status: string, action: string) {
	if (TERMINAL_STATUSES.has(status)) {
		throw new CampaignStateError(
			`Cannot ${action}: campaign is in terminal status ${status}`,
			"TERMINAL_STATE",
		);
	}
}

export async function captureSenderSnapshot(): Promise<SenderSnapshot> {
	return {
		provider: process.env.EMAIL_PROVIDER?.trim() || null,
		mailFrom: process.env.MAIL_FROM?.trim() || null,
		capturedAt: new Date().toISOString(),
	};
}

function consentTypeForCampaign(type: string): EmailConsentType {
	return type === "PROMO" ? "marketing" : "general";
}

export async function transitionCampaignStatus(
	campaignId: string,
	expectedStatus: CampaignStatus | CampaignStatus[],
	nextStatus: CampaignStatus,
	data: Record<string, unknown> = {},
): Promise<void> {
	const expected = asStatusList(expectedStatus);

	if (expected.some((status) => TERMINAL_STATUSES.has(status)) && nextStatus === "DRAFT") {
		throw new CampaignStateError(
			`Cannot revert terminal campaign to DRAFT`,
			"TERMINAL_STATE",
		);
	}

	if (expected.some((status) => TERMINAL_STATUSES.has(status)) && nextStatus === "SCHEDULED") {
		throw new CampaignStateError(
			`Cannot revert terminal campaign to SCHEDULED`,
			"TERMINAL_STATE",
		);
	}

	const campaign = await loadCampaign(campaignId);
	if (TERMINAL_STATUSES.has(campaign.status) && (nextStatus === "DRAFT" || nextStatus === "SCHEDULED")) {
		throw new CampaignStateError(
			`Cannot revert terminal status ${campaign.status}`,
			"TERMINAL_STATE",
		);
	}

	const result = await db.newsletterCampaign.updateMany({
		where: {
			id: campaignId,
			status: expected.length === 1 ? expected[0] : { in: expected },
		},
		data: {
			...data,
			status: nextStatus,
		},
	});

	if (result.count !== 1) {
		throw new CampaignStateError(
			`Invalid campaign transition ${campaign.status} → ${nextStatus}`,
			"TRANSITION_CONFLICT",
		);
	}
}

async function assertHasEligibleRecipients(campaignId: string) {
	const pendingCount = await db.newsletterRecipient.count({
		where: {
			campaignId,
			status: "PENDING",
		},
	});

	const campaign = await loadCampaign(campaignId);
	const eligible = pendingCount > 0 || campaign.totalRecipients > 0;

	if (!eligible || (campaign.totalRecipients === 0 && pendingCount === 0)) {
		throw new CampaignStateError(
			"Zero eligible recipients: cannot schedule or send this campaign",
			"ZERO_RECIPIENTS",
		);
	}
}

export async function requestImmediateSend(campaignId: string): Promise<void> {
	const campaign = await loadCampaign(campaignId);
	assertNotTerminal(campaign.status, "send now");
	await assertHasEligibleRecipients(campaignId);

	const result = await db.newsletterCampaign.updateMany({
		where: { id: campaignId, status: "DRAFT" },
		data: { status: "QUEUED" },
	});

	if (result.count !== 1) {
		throw new CampaignStateError(
			"Immediate send rejected: campaign is no longer DRAFT",
			"TRANSITION_CONFLICT",
		);
	}
}

export async function scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<void> {
	const campaign = await loadCampaign(campaignId);
	assertNotTerminal(campaign.status, "schedule");
	await assertHasEligibleRecipients(campaignId);

	const result = await db.newsletterCampaign.updateMany({
		where: { id: campaignId, status: "DRAFT" },
		data: {
			status: "SCHEDULED",
			scheduledAt,
		},
	});

	if (result.count !== 1) {
		throw new CampaignStateError(
			`Cannot schedule campaign from status ${campaign.status}`,
			"TRANSITION_CONFLICT",
		);
	}
}

export async function pauseCampaign(campaignId: string): Promise<void> {
	const result = await db.newsletterCampaign.updateMany({
		where: { id: campaignId, status: "SENDING" },
		data: { status: "PAUSED" },
	});

	if (result.count !== 1) {
		const campaign = await loadCampaign(campaignId);
		throw new CampaignStateError(
			`Cannot pause campaign from status ${campaign.status}`,
			"TRANSITION_CONFLICT",
		);
	}
}

export async function resumeCampaign(campaignId: string): Promise<void> {
	const result = await db.newsletterCampaign.updateMany({
		where: { id: campaignId, status: "PAUSED" },
		data: { status: "QUEUED" },
	});

	if (result.count !== 1) {
		const campaign = await loadCampaign(campaignId);
		throw new CampaignStateError(
			`Cannot resume campaign from status ${campaign.status}`,
			"TRANSITION_CONFLICT",
		);
	}
}

export async function cancelCampaign(campaignId: string): Promise<void> {
	const result = await db.newsletterCampaign.updateMany({
		where: {
			id: campaignId,
			status: { in: [...NON_TERMINAL_STATUSES] },
		},
		data: { status: "CANCELLED" },
	});

	if (result.count !== 1) {
		const campaign = await loadCampaign(campaignId);
		throw new CampaignStateError(
			`Cannot cancel campaign from status ${campaign.status}`,
			"TRANSITION_CONFLICT",
		);
	}
}

export async function queueDueScheduledCampaigns(
	now: Date = new Date(),
): Promise<{ queued: number; campaignIds: string[] }> {
	const due = await db.newsletterCampaign.findMany({
		where: {
			status: "SCHEDULED",
			scheduledAt: { lte: now },
		},
	});

	const campaignIds: string[] = [];

	for (const campaign of due) {
		const result = await db.newsletterCampaign.updateMany({
			where: { id: campaign.id, status: "SCHEDULED" },
			data: { status: "QUEUED" },
		});

		if (result.count === 1) {
			campaignIds.push(campaign.id);
		}
	}

	return { queued: campaignIds.length, campaignIds };
}

async function claimQueuedForSending(
	campaignId: string,
	snapshot: SenderSnapshot | Record<string, unknown>,
	now: Date,
): Promise<boolean> {
	const result = await db.newsletterCampaign.updateMany({
		where: { id: campaignId, status: "QUEUED" },
		data: {
			status: "SENDING",
			senderSnapshot: snapshot as Prisma.InputJsonValue,
			snapshotAt: now,
			lastHeartbeatAt: now,
		},
	});

	return result.count === 1;
}

async function remainingRateCapacity(
	campaignId: string,
	ratePerMinute: number,
	now: Date,
): Promise<number> {
	const windowStart = new Date(now.getTime() - RATE_WINDOW_MS + 1);
	const sentInWindow = await db.newsletterRecipient.count({
		where: {
			campaignId,
			status: "SENT",
			sentAt: { gte: windowStart },
		},
	});

	return Math.max(0, ratePerMinute - sentInWindow);
}

async function finalizeCampaignIfDone(campaignId: string): Promise<boolean> {
	const pending = await db.newsletterRecipient.count({
		where: {
			campaignId,
			status: { in: ["PENDING", "PROCESSING"] },
		},
	});

	if (pending > 0) {
		return false;
	}

	const campaign = await loadCampaign(campaignId);
	const nextStatus =
		campaign.failedCount > 0 && campaign.sentCount > 0
			? "PARTIAL_FAILED"
			: campaign.failedCount > 0 && campaign.sentCount === 0
				? "FAILED"
				: "SENT";

	await db.newsletterCampaign.updateMany({
		where: {
			id: campaignId,
			status: { in: ["SENDING", "QUEUED"] },
		},
		data: { status: nextStatus },
	});

	return true;
}

export async function dispatchCampaignBatch(
	campaignId: string,
	options: DispatchBatchOptions = {},
): Promise<DispatchBatchResult> {
	const now = options.now ?? new Date();
	const batchSize = options.batchSize ?? BATCH_SIZE;
	const sendEmail = options.sendEmail ?? defaultSendEmail;
	const assertEmailConsent = options.assertEmailConsent ?? defaultAssertEmailConsent;
	const captureSnapshot = options.captureSenderSnapshot ?? captureSenderSnapshot;

	let campaign = await loadCampaign(campaignId);

	if (campaign.status === "PAUSED" || campaign.status === "CANCELLED" || TERMINAL_STATUSES.has(campaign.status)) {
		return { sent: 0, skipped: 0, failed: 0, rateLimited: false, completed: TERMINAL_STATUSES.has(campaign.status) };
	}

	if (campaign.status === "QUEUED") {
		const snapshot = campaign.senderSnapshot ?? (await captureSnapshot());
		const claimed = await claimQueuedForSending(campaignId, snapshot as SenderSnapshot, now);
		if (!claimed && !(await loadCampaign(campaignId)).senderSnapshot) {
			return { sent: 0, skipped: 0, failed: 0, rateLimited: false, completed: false };
		}

		campaign = await loadCampaign(campaignId);
	}

	if (campaign.status !== "SENDING") {
		return { sent: 0, skipped: 0, failed: 0, rateLimited: false, completed: false };
	}

	if (!campaign.senderSnapshot) {
		const snapshot = await captureSnapshot();
		await db.newsletterCampaign.updateMany({
			where: {
				id: campaignId,
				status: "SENDING",
				senderSnapshot: null as unknown as Prisma.JsonNullableFilter,
			},
			data: {
				senderSnapshot: snapshot as Prisma.InputJsonValue,
				snapshotAt: now,
			},
		});
		campaign = await loadCampaign(campaignId);
	}

	const capacity = await remainingRateCapacity(campaignId, campaign.ratePerMinute, now);
	if (capacity <= 0) {
		await db.newsletterCampaign.updateMany({
			where: { id: campaignId, status: "SENDING" },
			data: { lastHeartbeatAt: now },
		});
		return { sent: 0, skipped: 0, failed: 0, rateLimited: true, completed: false };
	}

	const take = Math.min(batchSize, capacity);
	const recipients = await db.newsletterRecipient.findMany({
		where: { campaignId, status: "PENDING" },
		orderBy: { id: "asc" },
		take,
	});

	const snapshot = (campaign.senderSnapshot ?? {}) as SenderSnapshot;
	const mailFrom =
		typeof snapshot.mailFrom === "string" && snapshot.mailFrom.trim()
			? snapshot.mailFrom
			: undefined;
	const consentType = consentTypeForCampaign(campaign.type);

	let sent = 0;
	let skipped = 0;
	let failed = 0;

	for (const recipient of recipients) {
		const latest = await loadCampaign(campaignId);
		if (latest.status !== "SENDING") {
			break;
		}

		const claimed = await db.newsletterRecipient.updateMany({
			where: { id: recipient.id, status: "PENDING" },
			data: {
				status: "PROCESSING",
				attemptCount: (recipient.attemptCount ?? 0) + 1,
			},
		});

		if (claimed.count !== 1) {
			continue;
		}

		if (recipient.userId) {
			const consent = await assertEmailConsent(recipient.userId, consentType);
			if (!consent.allowed) {
				await db.newsletterRecipient.update({
					where: { id: recipient.id },
					data: {
						status: "SKIPPED",
						skipReason: consent.reason ?? "consent_denied",
					},
				});
				const current = await loadCampaign(campaignId);
				await db.newsletterCampaign.update({
					where: { id: campaignId },
					data: {
						skippedCount: current.skippedCount + 1,
						sentCursor: current.sentCursor + 1,
						lastHeartbeatAt: now,
					},
				});
				skipped += 1;
				continue;
			}
		}

		const accepted = await sendEmail({
			to: recipient.toEmail,
			from: mailFrom,
			subject: campaign.subject,
			html: campaign.bodyHtml ?? undefined,
			text: campaign.bodyText ?? undefined,
		});

		if (accepted) {
			await db.newsletterRecipient.update({
				where: { id: recipient.id },
				data: {
					status: "SENT",
					sentAt: now,
					errorMessage: null,
				},
			});
			const current = await loadCampaign(campaignId);
			await db.newsletterCampaign.update({
				where: { id: campaignId },
				data: {
					sentCount: current.sentCount + 1,
					sentCursor: current.sentCursor + 1,
					lastHeartbeatAt: now,
				},
			});
			sent += 1;
		} else {
			await db.newsletterRecipient.update({
				where: { id: recipient.id },
				data: {
					status: "FAILED",
					errorMessage: "Email provider rejected delivery",
				},
			});
			const current = await loadCampaign(campaignId);
			await db.newsletterCampaign.update({
				where: { id: campaignId },
				data: {
					failedCount: current.failedCount + 1,
					sentCursor: current.sentCursor + 1,
					lastHeartbeatAt: now,
				},
			});
			failed += 1;
		}
	}

	const completed = await finalizeCampaignIfDone(campaignId);
	const rateLimited = sent + skipped + failed >= capacity && capacity < batchSize;

	return {
		sent,
		skipped,
		failed,
		rateLimited: rateLimited || (capacity <= sent && recipients.length > 0),
		completed,
	};
}

export async function runNewsletterDispatchTick(now: Date = new Date()): Promise<{
	queued: number;
	dispatched: number;
	sent: number;
	skipped: number;
	failed: number;
	campaignIds: string[];
}> {
	const queuedResult = await queueDueScheduledCampaigns(now);

	const actionable = await db.newsletterCampaign.findMany({
		where: {
			status: { in: ["QUEUED", "SENDING"] },
		},
	});

	let dispatched = 0;
	let sent = 0;
	let skipped = 0;
	let failed = 0;

	for (const campaign of actionable) {
		const result = await dispatchCampaignBatch(campaign.id, { now });
		dispatched += 1;
		sent += result.sent;
		skipped += result.skipped;
		failed += result.failed;
	}

	return {
		queued: queuedResult.queued,
		dispatched,
		sent,
		skipped,
		failed,
		campaignIds: queuedResult.campaignIds,
	};
}
