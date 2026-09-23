import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { sendEmail } from "@startkiter/mail";

import { assertEmailConsent } from "./email-consent";
import { assertPromotionalCampaignCanActivate } from "./compliance";

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

/**
 * provider timeout 必須短於 recipient lease；send 期間靠 heartbeat 刷新租約。
 * 測試可覆寫數值。
 */
export const sendEngineConfig = {
	providerSendTimeoutMs: 30_000,
	leaseHeartbeatIntervalMs: 15_000,
};

function now() {
	return sendEngineClock.now();
}

/**
 * 原子狀態轉換：UPDATE ... WHERE status ∈ expected。
 * 終態不可回退到 DRAFT／SCHEDULED。
 */

export async function transitionCampaignStatus(
	paramsOrCampaignId:
		| {
				campaignId: string;
				from: NewsletterCampaignStatus | NewsletterCampaignStatus[];
				to: NewsletterCampaignStatus;
				data?: Record<string, unknown>;
			}
		| string,
	from?: NewsletterCampaignStatus | NewsletterCampaignStatus[],
	to?: NewsletterCampaignStatus,
	data: Record<string, unknown> = {},
): Promise<{ ok: true }> {
	const params =
		typeof paramsOrCampaignId === "string"
			? { campaignId: paramsOrCampaignId, from: from!, to: to!, data }
			: paramsOrCampaignId;
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
	attemptToken: string;
} | null> {
	const staleRecipient = new Date(now().getTime() - RECIPIENT_LEASE_MS);
	const attemptToken = randomUUID();
	const candidate = await db.newsletterRecipient.findFirst({
		where: {
			campaignId,
			isTest: false,
			OR: [
				{ status: "PENDING" },
				{ status: "PROCESSING", updatedAt: { lt: staleRecipient } },
				{ status: "FAILED", errorMessage: "provider_send_timeout" },
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
				{ status: "FAILED", errorMessage: "provider_send_timeout" },
			],
		},
		data: {
			status: "PROCESSING",
			attemptToken,
			errorMessage: null,
			skipReason: null,
			attemptCount: { increment: 1 },
		},
	});

	if (claimed.count !== 1) return null;
	return {
		id: candidate.id,
		userId: candidate.userId ?? null,
		toEmail: candidate.toEmail,
		attemptToken,
	};
}

/** 僅持有相同 attemptToken 的 worker 可把 PROCESSING 收成終態。 */
async function completeClaimedRecipient(params: {
	id: string;
	attemptToken: string;
	data: Record<string, unknown>;
}): Promise<boolean> {
	const updated = await db.newsletterRecipient.updateMany({
		where: {
			id: params.id,
			status: "PROCESSING",
			attemptToken: params.attemptToken,
		},
		data: params.data,
	});
	return updated.count === 1;
}

/** 刷新 recipient 租約與 campaign heartbeat，避免 in-flight 被當成 stale。 */
async function touchInFlightLease(params: {
	recipientId: string;
	attemptToken: string;
	campaignId: string;
}): Promise<void> {
	const touchedAt = now();
	await db.newsletterRecipient.updateMany({
		where: {
			id: params.recipientId,
			status: "PROCESSING",
			attemptToken: params.attemptToken,
		},
		data: { updatedAt: touchedAt },
	});
	await db.newsletterCampaign.update({
		where: { id: params.campaignId },
		data: { lastHeartbeatAt: touchedAt },
	});
}

/**
 * 帶 AbortSignal timeout 的寄信；期間定期 heartbeat。
 * timeout 後標 FAILED（當前 attemptToken），不坐等 hung provider。
 */
async function sendEmailWithLeaseGuard(params: {
	campaignId: string;
	recipientId: string;
	attemptToken: string;
	to: string;
	from: string;
	subject: string;
	html?: string;
	text?: string;
}): Promise<"sent" | "failed" | "timeout" | "lost_claim"> {
	const controller = new AbortController();
	const timeoutMs = sendEngineConfig.providerSendTimeoutMs;
	const heartbeatMs = sendEngineConfig.leaseHeartbeatIntervalMs;

	const timeoutId = setTimeout(() => {
		controller.abort();
	}, timeoutMs);

	const heartbeatId = setInterval(() => {
		void touchInFlightLease({
			recipientId: params.recipientId,
			attemptToken: params.attemptToken,
			campaignId: params.campaignId,
		});
	}, heartbeatMs);

	// 立刻碰一次，避免剛 claim 後長時間無刷新
	await touchInFlightLease({
		recipientId: params.recipientId,
		attemptToken: params.attemptToken,
		campaignId: params.campaignId,
	});

	try {
		const ok = await sendEmail({
			to: params.to,
			from: params.from,
			subject: params.subject,
			html: params.html,
			text: params.text,
			signal: controller.signal,
		});

		// abort 優先：就算 provider 回 false，timeout 路徑一律標 provider_send_timeout
		if (controller.signal.aborted) {
			const closed = await completeClaimedRecipient({
				id: params.recipientId,
				attemptToken: params.attemptToken,
				data: { status: "FAILED", errorMessage: "provider_send_timeout" },
			});
			return closed ? "timeout" : "lost_claim";
		}

		if (ok) {
			const closed = await completeClaimedRecipient({
				id: params.recipientId,
				attemptToken: params.attemptToken,
				data: { status: "SENT", sentAt: now(), errorMessage: null },
			});
			return closed ? "sent" : "lost_claim";
		}

		const closed = await completeClaimedRecipient({
			id: params.recipientId,
			attemptToken: params.attemptToken,
			data: { status: "FAILED", errorMessage: "send_failed" },
		});
		return closed ? "failed" : "lost_claim";
	} finally {
		clearTimeout(timeoutId);
		clearInterval(heartbeatId);
	}
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

	const retryableTimeouts = await db.newsletterRecipient.count({
		where: {
			campaignId,
			isTest: false,
			status: "FAILED",
			errorMessage: "provider_send_timeout",
		},
	});
	if (retryableTimeouts > 0) return false;

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

		if (!claimed.userId) {
			const closed = await completeClaimedRecipient({
				id: claimed.id,
				attemptToken: claimed.attemptToken,
				data: { status: "SKIPPED", skipReason: "missing_user_identity" },
			});
			if (closed) {
				skipped += 1;
				await db.newsletterCampaign.update({
					where: { id: campaignId },
					data: { skippedCount: { increment: 1 }, lastHeartbeatAt: now() },
				});
			}
			continue;
		}

		const consent = await assertEmailConsent(
			claimed.userId,
			consentTypeForCampaign(campaign.type),
		);
		if (!consent.allowed) {
			const closed = await completeClaimedRecipient({
				id: claimed.id,
				attemptToken: claimed.attemptToken,
				data: { status: "SKIPPED", skipReason: consent.reason ?? "consent_denied" },
			});
			if (closed) {
				skipped += 1;
				await db.newsletterCampaign.update({
					where: { id: campaignId },
					data: { skippedCount: { increment: 1 }, lastHeartbeatAt: now() },
				});
			}
			continue;
		}

		const outcome = await sendEmailWithLeaseGuard({
			campaignId,
			recipientId: claimed.id,
			attemptToken: claimed.attemptToken,
			to: claimed.toEmail,
			from: snapshot.fromEmail,
			subject: campaign.subject,
			html: campaign.bodyHtml ?? undefined,
			text: campaign.bodyText ?? undefined,
		});

		if (outcome === "sent") {
			sent += 1;
			await db.newsletterCampaign.update({
				where: { id: campaignId },
				data: {
					sentCount: { increment: 1 },
					sentCursor: { increment: 1 },
					lastHeartbeatAt: now(),
				},
			});
		} else if (outcome === "failed" || outcome === "timeout") {
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

/** 相容既有後台 composer 的寄送 API；實際狀態機仍由 Wave 1B engine 管理。 */
export const BATCH_SIZE = 500;
export type CampaignStatus = NewsletterCampaignStatus;
export type AssertEmailConsentFn = typeof assertEmailConsent;
export type DispatchBatchOptions = {
	batchSize?: number;
	now?: Date;
};
export type DispatchBatchResult = {
	sent: number;
	skipped: number;
	failed: number;
	rateLimited?: boolean;
	completed?: boolean;
};

export class CampaignStateError extends SendEngineError {
	constructor(message: string, code: string) {
		super(code, message);
		this.name = "CampaignStateError";
	}
}

export async function captureSenderSnapshot(): Promise<SenderSnapshot> {
	return {
		fromEmail: process.env.MAIL_FROM?.trim() || process.env.SMTP_FROM?.trim() || "",
		senderName: process.env.MAIL_FROM_NAME?.trim() || "StartKiter",
		emailProvider: process.env.EMAIL_PROVIDER?.trim(),
		capturedAt: now().toISOString(),
	};
}

async function startExistingCampaign(
	campaignId: string,
	scheduledAt: Date | null,
	options: { senderPhysicalAddress?: string; appUrl?: string } = {},
): Promise<void> {
	const campaign = await db.newsletterCampaign.findUnique({
		where: { id: campaignId },
		select: { type: true },
	});
	if (!campaign) throw new CampaignStateError("找不到電子報", "NOT_FOUND");
	try {
		assertPromotionalCampaignCanActivate({
			type: campaign.type,
			senderPhysicalAddress: options.senderPhysicalAddress,
		});
	} catch (error) {
		throw new CampaignStateError(
			error instanceof Error ? error.message : "寄件人實體地址尚未設定",
			"SENDER_PHYSICAL_ADDRESS_REQUIRED",
		);
	}
	const eligibleRecipientCount = await db.newsletterRecipient.count({
		where: { campaignId, status: "PENDING", isTest: false },
	});
	const senderSnapshot = await captureSenderSnapshot();
	await startCampaignSend({
		campaignId,
		scheduledAt,
		senderSnapshot: {
			...senderSnapshot,
			...(options.senderPhysicalAddress ? { senderPhysicalAddress: options.senderPhysicalAddress } : {}),
			...(options.appUrl ? { appUrl: options.appUrl } : {}),
		},
		eligibleRecipientCount,
	});
}

export async function requestImmediateSend(
	campaignId: string,
	options: { senderPhysicalAddress?: string; appUrl?: string } = {},
): Promise<void> {
	await startExistingCampaign(campaignId, null, options);
}

export async function scheduleCampaign(
	campaignId: string,
	scheduledAt: Date,
	options: { senderPhysicalAddress?: string; appUrl?: string } = {},
): Promise<void> {
	await startExistingCampaign(campaignId, scheduledAt, options);
}

export async function queueDueScheduledCampaigns(at: Date = now()): Promise<{ queued: number }> {
	return queueDueCampaigns(at);
}

export async function dispatchCampaignBatch(
	campaignId: string,
	options: DispatchBatchOptions = {},
): Promise<DispatchBatchResult> {
	return processCampaignDispatch(campaignId, { maxSends: options.batchSize });
}

export async function runNewsletterDispatchTick(at: Date = now()): Promise<{ queued: number; processed: number }> {
	return dispatchNewsletters({ windowMs: Math.max(1000, at.getTime() - Date.now() + 45_000) });
}
