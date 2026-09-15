import { db } from "@startkiter/database";
import { sendEmail } from "@startkiter/mail";

import { assertEmailConsent } from "./email-consent";

export type NewsletterCampaignStatus =
	| "DRAFT"
	| "SCHEDULED"
	| "QUEUED"
	| "SENDING"
	| "PAUSED"
	| "SENT"
	| "PARTIAL_FAILED"
	| "FAILED"
	| "CANCELLED";

export type SenderSnapshot = {
	fromEmail: string;
	senderName: string;
	emailProvider?: string;
	capturedAt: string;
	[key: string]: unknown;
};

export class SendEngineError extends Error {
	readonly code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = "SendEngineError";
		this.code = code;
	}
}

const TERMINAL_STATUSES: NewsletterCampaignStatus[] = ["SENT", "FAILED", "CANCELLED"];
const RATE_WINDOW_MS = 60_000;
const STALE_HEARTBEAT_MS = 5 * 60_000;
const RECIPIENT_LEASE_MS = 2 * 60_000;
const DEFAULT_CRON_WINDOW_MS = 45_000;

/** 可替換時鐘，測試用（勿在正式路徑覆寫）。 */
export const sendEngineClock = {
	now: (): Date => new Date(),
};

function now() {
	return sendEngineClock.now();
}

/**
 * 原子狀態轉換：UPDATE ... WHERE status ∈ expected。
 * 終態不可回退到 DRAFT／SCHEDULED。
 */
export async function transitionCampaignStatus(params: {
	campaignId: string;
	from: NewsletterCampaignStatus | NewsletterCampaignStatus[];
	to: NewsletterCampaignStatus;
	data?: Record<string, unknown>;
}): Promise<{ ok: true }> {
	const fromStatuses = Array.isArray(params.from) ? params.from : [params.from];

	const current = await db.newsletterCampaign.findUnique({
		where: { id: params.campaignId },
		select: { status: true },
	});

	if (
		current &&
		TERMINAL_STATUSES.includes(current.status as NewsletterCampaignStatus) &&
		(params.to === "DRAFT" || params.to === "SCHEDULED")
	) {
		throw new SendEngineError("TERMINAL_REVERT", "終態不可回退到 DRAFT 或 SCHEDULED");
	}

	if (
		(params.to === "DRAFT" || params.to === "SCHEDULED") &&
		fromStatuses.some((status) => TERMINAL_STATUSES.includes(status))
	) {
		throw new SendEngineError("TERMINAL_REVERT", "終態不可回退到 DRAFT 或 SCHEDULED");
	}

	const updated = await db.newsletterCampaign.updateMany({
		where: { id: params.campaignId, status: { in: fromStatuses } },
		data: {
			status: params.to,
			...(params.data ?? {}),
		},
	});

	if (updated.count !== 1) {
		throw new SendEngineError("STATUS_CONFLICT", "狀態已變更，請重新整理後再試");
	}

	return { ok: true };
}

/**
 * 立即發送或排程。雙擊只會有一次成功進入 QUEUED／SCHEDULED。
 * 零收件人直接擋下。senderSnapshot 在啟動時鎖定（PAUSED 續發不覆寫）。
 */
export async function startCampaignSend(params: {
	campaignId: string;
	scheduledAt?: Date | null;
	senderSnapshot: SenderSnapshot;
	eligibleRecipientCount: number;
}): Promise<{ status: NewsletterCampaignStatus }> {
	if (params.eligibleRecipientCount <= 0) {
		throw new SendEngineError("ZERO_RECIPIENTS", "零位合格收件人，無法排程或發送");
	}

	const existing = await db.newsletterCampaign.findUnique({
		where: { id: params.campaignId },
		select: { status: true, senderSnapshot: true },
	});

	const nextStatus: NewsletterCampaignStatus = params.scheduledAt ? "SCHEDULED" : "QUEUED";
	const isResume = existing?.status === "PAUSED";
	const snapshotAt = now();

	try {
		await transitionCampaignStatus({
			campaignId: params.campaignId,
			from: ["DRAFT", "PAUSED", "SCHEDULED"],
			to: nextStatus,
			data: {
				scheduledAt: params.scheduledAt ?? null,
				...(isResume
					? {}
					: {
							totalRecipients: params.eligibleRecipientCount,
							snapshotAt,
							senderSnapshot: params.senderSnapshot,
						}),
			},
		});
	} catch (error) {
		if (error instanceof SendEngineError && error.code === "STATUS_CONFLICT") {
			throw new SendEngineError("ALREADY_STARTED", "此電子報已進入發送流程，請勿重複點擊");
		}
		throw error;
	}

	return { status: nextStatus };
}

export async function pauseCampaign(campaignId: string): Promise<void> {
	await transitionCampaignStatus({
		campaignId,
		from: ["QUEUED", "SENDING"],
		to: "PAUSED",
	});
}

export async function resumeCampaign(campaignId: string): Promise<void> {
	await transitionCampaignStatus({
		campaignId,
		from: ["PAUSED"],
		to: "QUEUED",
	});
}

export async function cancelCampaign(campaignId: string): Promise<void> {
	await transitionCampaignStatus({
		campaignId,
		from: ["DRAFT", "SCHEDULED", "QUEUED", "SENDING", "PAUSED", "PARTIAL_FAILED"],
		to: "CANCELLED",
	});
}

/** Cron：把到期的 SCHEDULED 原子轉成 QUEUED（不做實際寄信）。 */
export async function queueDueCampaigns(at: Date = now()): Promise<{ queued: number }> {
	const result = await db.newsletterCampaign.updateMany({
		where: {
			status: "SCHEDULED",
			scheduledAt: { lte: at },
		},
		data: { status: "QUEUED" },
	});
	return { queued: result.count };
}

function consentTypeForCampaign(type: string): "general" | "marketing" {
	return type === "PROMO" ? "marketing" : "general";
}

async function countSendsInWindow(campaignId: string, windowStart: Date): Promise<number> {
	return db.newsletterRecipient.count({
		where: {
			campaignId,
			status: "SENT",
			sentAt: { gte: windowStart },
		},
	});
}

async function claimNextRecipient(campaignId: string): Promise<{
	id: string;
	userId: string | null;
	toEmail: string;
} | null> {
	const staleRecipient = new Date(now().getTime() - RECIPIENT_LEASE_MS);
	const candidate = await db.newsletterRecipient.findFirst({
		where: {
			campaignId,
			isTest: false,
			OR: [
				{ status: "PENDING" },
				{ status: "PROCESSING", updatedAt: { lt: staleRecipient } },
			],
		},
		orderBy: { createdAt: "asc" },
		select: { id: true, userId: true, toEmail: true },
	});
	if (!candidate) return null;

	const claimed = await db.newsletterRecipient.updateMany({
		where: {
			id: candidate.id,
			OR: [
				{ status: "PENDING" },
				{ status: "PROCESSING", updatedAt: { lt: staleRecipient } },
			],
		},
		data: {
			status: "PROCESSING",
			errorMessage: null,
			attemptCount: { increment: 1 },
		},
	});

	if (claimed.count !== 1) return null;
	return {
		id: candidate.id,
		userId: candidate.userId ?? null,
		toEmail: candidate.toEmail,
	};
}

async function finalizeCampaignIfDone(campaignId: string): Promise<boolean> {
	const activeProcessing = await db.newsletterRecipient.count({
		where: {
			campaignId,
			isTest: false,
			status: "PROCESSING",
			updatedAt: { gte: new Date(now().getTime() - RECIPIENT_LEASE_MS) },
		},
	});
	if (activeProcessing > 0) return false;

	const pending = await db.newsletterRecipient.count({
		where: { campaignId, isTest: false, status: "PENDING" },
	});
	if (pending > 0) return false;

	const counts = await db.newsletterRecipient.groupBy({
		by: ["status"],
		where: { campaignId, isTest: false },
		_count: true,
	});
	const failed = counts.find((row) => row.status === "FAILED")?._count ?? 0;

	await db.newsletterCampaign.updateMany({
		where: { id: campaignId, status: "SENDING" },
		data: { status: failed > 0 ? "PARTIAL_FAILED" : "SENT" },
	});
	return true;
}

/**
 * 處理單一 campaign 的一批寄送：斷點續發、同意重查、Token Bucket 節流、鎖定 snapshot。
 */
export async function processCampaignDispatch(
	campaignId: string,
	options: { maxSends?: number } = {},
): Promise<{ sent: number; skipped: number; failed: number }> {
	const campaign = await db.newsletterCampaign.findUnique({
		where: { id: campaignId },
		select: {
			id: true,
			type: true,
			status: true,
			ratePerMinute: true,
			senderSnapshot: true,
			subject: true,
			bodyHtml: true,
			bodyText: true,
		},
	});

	if (!campaign || campaign.status !== "SENDING") {
		return { sent: 0, skipped: 0, failed: 0 };
	}

	const snapshot = campaign.senderSnapshot as SenderSnapshot | null;
	if (!snapshot?.fromEmail) {
		throw new SendEngineError("MISSING_SNAPSHOT", "缺少 senderSnapshot，無法發送");
	}

	const rate = Math.max(1, campaign.ratePerMinute ?? 60);
	const maxSends = options.maxSends ?? rate;
	let sent = 0;
	let skipped = 0;
	let failed = 0;

	while (sent + skipped + failed < maxSends) {
		const fresh = await db.newsletterCampaign.findUnique({
			where: { id: campaignId },
			select: { status: true },
		});
		if (!fresh || fresh.status !== "SENDING") break;

		const windowStart = new Date(now().getTime() - RATE_WINDOW_MS);
		const inWindow = await countSendsInWindow(campaignId, windowStart);
		if (inWindow >= rate) break;

		const claimed = await claimNextRecipient(campaignId);
		if (!claimed) {
			await finalizeCampaignIfDone(campaignId);
			break;
		}

		if (claimed.userId) {
			const consent = await assertEmailConsent(
				claimed.userId,
				consentTypeForCampaign(campaign.type),
			);
			if (!consent.allowed) {
				await db.newsletterRecipient.updateMany({
					where: { id: claimed.id, status: "PROCESSING" },
					data: { status: "SKIPPED", skipReason: consent.reason ?? "consent_denied" },
				});
				skipped += 1;
				await db.newsletterCampaign.update({
					where: { id: campaignId },
					data: { skippedCount: { increment: 1 }, lastHeartbeatAt: now() },
				});
				continue;
			}
		}

		const ok = await sendEmail({
			to: claimed.toEmail,
			from: snapshot.fromEmail,
			subject: campaign.subject,
			html: campaign.bodyHtml ?? undefined,
			text: campaign.bodyText ?? undefined,
		});

		if (ok) {
			await db.newsletterRecipient.updateMany({
				where: { id: claimed.id, status: "PROCESSING" },
				data: { status: "SENT", sentAt: now(), errorMessage: null },
			});
			sent += 1;
			await db.newsletterCampaign.update({
				where: { id: campaignId },
				data: {
					sentCount: { increment: 1 },
					sentCursor: { increment: 1 },
					lastHeartbeatAt: now(),
				},
			});
		} else {
			await db.newsletterRecipient.updateMany({
				where: { id: claimed.id, status: "PROCESSING" },
				data: { status: "FAILED", errorMessage: "send_failed" },
			});
			failed += 1;
			await db.newsletterCampaign.update({
				where: { id: campaignId },
				data: { failedCount: { increment: 1 }, lastHeartbeatAt: now() },
			});
		}
	}

	await finalizeCampaignIfDone(campaignId);
	return { sent, skipped, failed };
}

async function claimCampaignForSending(campaignId: string): Promise<boolean> {
	const staleHeartbeat = new Date(now().getTime() - STALE_HEARTBEAT_MS);
	const claimed = await db.newsletterCampaign.updateMany({
		where: {
			id: campaignId,
			OR: [
				{ status: "QUEUED" },
				{ status: "SENDING", lastHeartbeatAt: { lt: staleHeartbeat } },
			],
		},
		data: {
			status: "SENDING",
			lastHeartbeatAt: now(),
		},
	});
	return claimed.count === 1;
}

/**
 * Cron／啟動後呼叫：先原子排隊到期排程，再批次斷點續發。
 */
export async function dispatchNewsletters(
	options: { windowMs?: number } = {},
): Promise<{ queued: number; processed: number }> {
	const started = Date.now();
	const windowMs = Math.min(
		DEFAULT_CRON_WINDOW_MS,
		Math.max(1000, options.windowMs ?? DEFAULT_CRON_WINDOW_MS),
	);

	const { queued } = await queueDueCampaigns();

	const staleHeartbeat = new Date(now().getTime() - STALE_HEARTBEAT_MS);
	const campaigns = await db.newsletterCampaign.findMany({
		where: {
			OR: [
				{ status: "QUEUED" },
				{ status: "SENDING", lastHeartbeatAt: { lt: staleHeartbeat } },
			],
		},
		take: 3,
	});

	let processed = 0;
	for (const campaign of campaigns) {
		if (Date.now() - started >= windowMs) break;
		const claimed = await claimCampaignForSending(campaign.id);
		if (!claimed) continue;

		const fresh = await db.newsletterCampaign.findUnique({
			where: { id: campaign.id },
			select: { ratePerMinute: true },
		});
		const rate = Math.max(1, fresh?.ratePerMinute ?? 60);
		const result = await processCampaignDispatch(campaign.id, { maxSends: rate });
		processed += result.sent + result.skipped + result.failed;
	}

	return { queued, processed };
}
