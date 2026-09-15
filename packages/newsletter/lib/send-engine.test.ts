import { beforeEach, describe, expect, it, vi } from "vitest";

type CampaignStatus =
	| "DRAFT"
	| "SCHEDULED"
	| "QUEUED"
	| "SENDING"
	| "PAUSED"
	| "SENT"
	| "PARTIAL_FAILED"
	| "FAILED"
	| "CANCELLED";

type RecipientStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED" | "BOUNCED";

type CampaignRecord = {
	id: string;
	type: "GENERAL" | "PROMO";
	status: CampaignStatus;
	scheduledAt: Date | null;
	ratePerMinute: number;
	senderSnapshot: Record<string, unknown> | null;
	sentCursor: number;
	totalRecipients: number;
	sentCount: number;
	failedCount: number;
	skippedCount: number;
	lastHeartbeatAt: Date | null;
	snapshotAt: Date | null;
	subject: string;
	bodyHtml: string | null;
	bodyText: string | null;
	senderName: string | null;
	replyTo: string | null;
	errorMessage: string | null;
};

type CampaignUpdateData = Omit<
	Partial<CampaignRecord>,
	"sentCursor" | "sentCount" | "failedCount" | "skippedCount"
> & {
	sentCursor?: number | { increment: number };
	sentCount?: number | { increment: number };
	failedCount?: number | { increment: number };
	skippedCount?: number | { increment: number };
};

const COUNTER_FIELDS = ["sentCursor", "sentCount", "failedCount", "skippedCount"] as const;

function applyCampaignUpdate(campaign: CampaignRecord, data: CampaignUpdateData) {
	const normalized: Record<string, unknown> = { ...data };

	for (const field of COUNTER_FIELDS) {
		const update = normalized[field];
		if (
			typeof update === "object" &&
			update !== null &&
			"increment" in update &&
			typeof update.increment === "number"
		) {
			normalized[field] = campaign[field] + update.increment;
		}
	}

	Object.assign(campaign, normalized);
}

type RecipientRecord = {
	id: string;
	campaignId: string;
	userId: string | null;
	toEmail: string;
	status: RecipientStatus;
	skipReason: string | null;
	errorMessage: string | null;
	sentAt: Date | null;
	attemptCount: number;
};

const { dbState, sendEmail, assertEmailConsent } = vi.hoisted(() => {
	const dbState = {
		campaigns: new Map<string, CampaignRecord>(),
		recipients: new Map<string, RecipientRecord>(),
	};

	return {
		dbState,
		sendEmail: vi.fn(),
		assertEmailConsent: vi.fn(),
	};
});

function cloneCampaign(campaign: CampaignRecord): CampaignRecord {
	return {
		...campaign,
		senderSnapshot: campaign.senderSnapshot ? { ...campaign.senderSnapshot } : null,
		scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt) : null,
		lastHeartbeatAt: campaign.lastHeartbeatAt ? new Date(campaign.lastHeartbeatAt) : null,
		snapshotAt: campaign.snapshotAt ? new Date(campaign.snapshotAt) : null,
	};
}

function matchesStatus(
	actual: CampaignStatus,
	expected: CampaignStatus | { in: CampaignStatus[] } | undefined,
): boolean {
	if (expected == null) {
		return true;
	}

	if (typeof expected === "string") {
		return actual === expected;
	}

	return expected.in.includes(actual);
}

async function applyCampaignUpdateMany({
	where,
	data,
}: {
	where: { id?: string; status?: CampaignStatus | { in: CampaignStatus[] } };
	data: CampaignUpdateData;
}) {
	let count = 0;

	for (const [id, campaign] of dbState.campaigns) {
		if (where.id && id !== where.id) {
			continue;
		}

		if (!matchesStatus(campaign.status, where.status)) {
			continue;
		}

		applyCampaignUpdate(campaign, data);
		count += 1;
	}

	return { count };
}

vi.mock("@startkiter/database", () => ({
	db: {
		newsletterCampaign: {
			findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
				const campaign = dbState.campaigns.get(where.id);
				return campaign ? cloneCampaign(campaign) : null;
			}),
			findMany: vi.fn(async ({ where }: { where?: Record<string, unknown> } = {}) => {
				const rows = [...dbState.campaigns.values()].filter((campaign) => {
					if (!where) {
						return true;
					}

					if (where.status != null && !matchesStatus(campaign.status, where.status as never)) {
						return false;
					}

					if (where.scheduledAt && typeof where.scheduledAt === "object" && where.scheduledAt !== null) {
						const lte = (where.scheduledAt as { lte?: Date }).lte;
						if (lte && (!campaign.scheduledAt || campaign.scheduledAt.getTime() > lte.getTime())) {
							return false;
						}
					}

					return true;
				});

				return rows.map(cloneCampaign);
			}),
			updateMany: vi.fn(applyCampaignUpdateMany),
			update: vi.fn(
				async ({
					where,
					data,
				}: {
					where: { id: string };
					data: CampaignUpdateData;
				}) => {
					const campaign = dbState.campaigns.get(where.id);
					if (!campaign) {
						throw new Error(`Campaign ${where.id} not found`);
					}

					applyCampaignUpdate(campaign, data);
					return cloneCampaign(campaign);
				},
			),
		},
		newsletterRecipient: {
			findMany: vi.fn(
				async ({
					where,
					orderBy,
					take,
				}: {
					where?: {
						campaignId?: string;
						status?: RecipientStatus | { in: RecipientStatus[] };
						sentAt?: { gte?: Date };
					};
					orderBy?: { id?: "asc" | "desc" };
					take?: number;
				} = {}) => {
					let rows = [...dbState.recipients.values()];

					if (where?.campaignId) {
						rows = rows.filter((row) => row.campaignId === where.campaignId);
					}

					if (where?.status) {
						rows = rows.filter((row) => {
							if (typeof where.status === "string") {
								return row.status === where.status;
							}

							return where.status?.in.includes(row.status) ?? true;
						});
					}

					if (where?.sentAt?.gte) {
						const gte = where.sentAt.gte.getTime();
						rows = rows.filter((row) => row.sentAt != null && row.sentAt.getTime() >= gte);
					}

					if (orderBy?.id === "asc") {
						rows.sort((a, b) => a.id.localeCompare(b.id));
					}

					if (typeof take === "number") {
						rows = rows.slice(0, take);
					}

					return rows.map((row) => ({ ...row }));
				},
			),
			count: vi.fn(
				async ({
					where,
				}: {
					where?: {
						campaignId?: string;
						status?: RecipientStatus | { in: RecipientStatus[] };
						sentAt?: { gte?: Date };
					};
				} = {}) => {
					let rows = [...dbState.recipients.values()];

					if (where?.campaignId) {
						rows = rows.filter((row) => row.campaignId === where.campaignId);
					}

					if (where?.status) {
						rows = rows.filter((row) => {
							if (typeof where.status === "string") {
								return row.status === where.status;
							}

							return where.status?.in.includes(row.status) ?? true;
						});
					}

					if (where?.sentAt?.gte) {
						const gte = where.sentAt.gte.getTime();
						rows = rows.filter((row) => row.sentAt != null && row.sentAt.getTime() >= gte);
					}

					return rows.length;
				},
			),
			updateMany: vi.fn(
				async ({
					where,
					data,
				}: {
					where: { id?: string; campaignId?: string; status?: RecipientStatus };
					data: Partial<RecipientRecord>;
				}) => {
					let count = 0;

					for (const recipient of dbState.recipients.values()) {
						if (where.id && recipient.id !== where.id) {
							continue;
						}

						if (where.campaignId && recipient.campaignId !== where.campaignId) {
							continue;
						}

						if (where.status && recipient.status !== where.status) {
							continue;
						}

						Object.assign(recipient, data);
						count += 1;
					}

					return { count };
				},
			),
			update: vi.fn(
				async ({
					where,
					data,
				}: {
					where: { id: string };
					data: Partial<RecipientRecord>;
				}) => {
					const recipient = dbState.recipients.get(where.id);
					if (!recipient) {
						throw new Error(`Recipient ${where.id} not found`);
					}

					Object.assign(recipient, data);
					return { ...recipient };
				},
			),
		},
	},
}));

vi.mock("@startkiter/mail", () => ({
	sendEmail,
}));

vi.mock("./email-consent", () => ({
	assertEmailConsent,
}));

import { db } from "@startkiter/database";

import {
	cancelCampaign,
	dispatchCampaignBatch,
	pauseCampaign,
	queueDueScheduledCampaigns,
	requestImmediateSend,
	resumeCampaign,
	scheduleCampaign,
	transitionCampaignStatus,
} from "./send-engine";

const consentFn = assertEmailConsent;

function dispatch(
	campaignId: string,
	options: Parameters<typeof dispatchCampaignBatch>[1] = {},
) {
	return dispatchCampaignBatch(campaignId, {
		assertEmailConsent: consentFn,
		...options,
	});
}

function seedCampaign(overrides: Partial<CampaignRecord> = {}): CampaignRecord {
	const campaign: CampaignRecord = {
		id: "campaign-1",
		type: "GENERAL",
		status: "DRAFT",
		scheduledAt: null,
		ratePerMinute: 60,
		senderSnapshot: null,
		sentCursor: 0,
		totalRecipients: 0,
		sentCount: 0,
		failedCount: 0,
		skippedCount: 0,
		lastHeartbeatAt: null,
		snapshotAt: null,
		subject: "Hello",
		bodyHtml: "<p>Hello</p>",
		bodyText: "Hello",
		senderName: "StartKiter",
		replyTo: null,
		errorMessage: null,
		...overrides,
	};

	dbState.campaigns.set(campaign.id, campaign);
	return campaign;
}

function seedRecipients(
	campaignId: string,
	count: number,
	status: RecipientStatus = "PENDING",
): RecipientRecord[] {
	const created: RecipientRecord[] = [];

	for (let index = 0; index < count; index += 1) {
		const recipient: RecipientRecord = {
			id: `recipient-${String(index + 1).padStart(4, "0")}`,
			campaignId,
			userId: `user-${index + 1}`,
			toEmail: `user${index + 1}@example.com`,
			status,
			skipReason: null,
			errorMessage: null,
			sentAt: status === "SENT" ? new Date("2026-09-16T00:00:00.000Z") : null,
			attemptCount: 0,
		};

		dbState.recipients.set(recipient.id, recipient);
		created.push(recipient);
	}

	const campaign = dbState.campaigns.get(campaignId);
	if (campaign) {
		campaign.totalRecipients = count;
		if (status === "SENT") {
			campaign.sentCount = count;
			campaign.sentCursor = count;
		}
	}

	return created;
}

describe("newsletter send engine", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dbState.campaigns.clear();
		dbState.recipients.clear();
		sendEmail.mockResolvedValue(true);
		assertEmailConsent.mockResolvedValue({ allowed: true });
		vi.mocked(db.newsletterCampaign.updateMany).mockImplementation(applyCampaignUpdateMany as never);
	});

	describe("Campaign state machine with atomic transitions", () => {
		it("lets only one concurrent immediate-send claim succeed", async () => {
			seedCampaign({ status: "DRAFT", totalRecipients: 2 });
			seedRecipients("campaign-1", 2);

			const campaign = dbState.campaigns.get("campaign-1")!;

			let entered = 0;
			let release!: () => void;
			const gate = new Promise<void>((resolve) => {
				release = resolve;
			});

			vi.mocked(db.newsletterCampaign.updateMany).mockImplementation(
				(async ({
					where,
					data,
				}: {
					where: { id?: string; status?: CampaignStatus | { in: CampaignStatus[] } };
					data: Partial<CampaignRecord>;
				}) => {
					entered += 1;
					if (entered === 1) {
						release();
						await new Promise((resolve) => setTimeout(resolve, 20));
					} else {
						await gate;
					}

					if (where.id && where.id !== campaign.id) {
						return { count: 0 };
					}

					if (!matchesStatus(campaign.status, where.status)) {
						return { count: 0 };
					}

					Object.assign(campaign, data);
					return { count: 1 };
				}) as never,
			);

			const [first, second] = await Promise.allSettled([
				requestImmediateSend("campaign-1"),
				requestImmediateSend("campaign-1"),
			]);

			const successes = [first, second].filter((result) => result.status === "fulfilled");
			const failures = [first, second].filter((result) => result.status === "rejected");

			expect(successes).toHaveLength(1);
			expect(failures).toHaveLength(1);
			expect((failures[0] as PromiseRejectedResult).reason).toBeInstanceOf(Error);
			expect(dbState.campaigns.get("campaign-1")?.status).toBe("QUEUED");
		});

		it("rejects transitions out of terminal SENT/FAILED/CANCELLED", async () => {
			for (const terminal of ["SENT", "FAILED", "CANCELLED"] as const) {
				dbState.campaigns.clear();
				dbState.recipients.clear();
				seedCampaign({ id: `campaign-${terminal}`, status: terminal, totalRecipients: 1 });
				seedRecipients(`campaign-${terminal}`, 1);

				await expect(
					transitionCampaignStatus(`campaign-${terminal}`, terminal, "DRAFT"),
				).rejects.toThrow(/terminal|cannot|revert|invalid/i);

				await expect(
					scheduleCampaign(`campaign-${terminal}`, new Date("2026-09-17T00:00:00.000Z")),
				).rejects.toThrow(/terminal|cannot|revert|invalid|status/i);

				expect(dbState.campaigns.get(`campaign-${terminal}`)?.status).toBe(terminal);
			}
		});
	});

	describe("Idempotent recipient dispatch with resume", () => {
		it("resumes after interruption without re-sending completed recipients", async () => {
			seedCampaign({
				status: "SENDING",
				totalRecipients: 1000,
				sentCount: 300,
				sentCursor: 300,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				ratePerMinute: 10_000,
			});

			const recipients = seedRecipients("campaign-1", 1000, "PENDING");
			for (let index = 0; index < 300; index += 1) {
				recipients[index]!.status = "SENT";
				recipients[index]!.sentAt = new Date("2026-09-16T00:00:00.000Z");
			}

			const result = await dispatch("campaign-1", {
				batchSize: 50,
				now: new Date("2026-09-16T01:00:00.000Z"),
			});

			expect(result.sent).toBe(50);
			expect(sendEmail).toHaveBeenCalledTimes(50);
			expect(
				sendEmail.mock.calls.every((call) => {
					const to = call[0]?.to as string;
					const index = Number(to.match(/user(\d+)@/)?.[1] ?? 0);
					return index > 300;
				}),
			).toBe(true);

			const resent = [...dbState.recipients.values()].filter(
				(row) =>
					row.status === "SENT" &&
					Number(row.id.replace("recipient-", "")) <= 300 &&
					row.sentAt?.toISOString() !== "2026-09-16T00:00:00.000Z",
			);
			expect(resent).toHaveLength(0);
			expect(dbState.campaigns.get("campaign-1")?.sentCount).toBe(350);
		});

		it("reclaims a stale PROCESSING recipient after a dispatch crash", async () => {
			seedCampaign({
				status: "SENDING",
				totalRecipients: 1,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				lastHeartbeatAt: new Date("2026-09-16T00:00:00.000Z"),
				ratePerMinute: 60,
			});
			const [recipient] = seedRecipients("campaign-1", 1);

			sendEmail.mockRejectedValueOnce(new Error("simulated process crash"));
			await expect(
				dispatch("campaign-1", {
					batchSize: 1,
					now: new Date("2026-09-16T01:00:00.000Z"),
				}),
			).rejects.toThrow("simulated process crash");
			expect(dbState.recipients.get(recipient!.id)?.status).toBe("PROCESSING");

			const resumed = await dispatch("campaign-1", {
				batchSize: 1,
				now: new Date("2026-09-16T01:06:00.000Z"),
			});

			expect(resumed.sent).toBe(1);
			expect(resumed.completed).toBe(true);
			expect(dbState.recipients.get(recipient!.id)?.status).toBe("SENT");
			expect(dbState.campaigns.get("campaign-1")?.status).toBe("SENT");
			expect(sendEmail).toHaveBeenCalledTimes(2);
		});
	});

	describe("Pause, resume, and cancel", () => {
		it("pauses sending, resumes from cursor, and cancels without touching sent rows", async () => {
			seedCampaign({
				status: "SENDING",
				totalRecipients: 1000,
				sentCount: 400,
				sentCursor: 400,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				ratePerMinute: 10_000,
			});
			const recipients = seedRecipients("campaign-1", 1000, "PENDING");
			for (let index = 0; index < 400; index += 1) {
				recipients[index]!.status = "SENT";
				recipients[index]!.sentAt = new Date("2026-09-16T00:00:00.000Z");
			}

			await pauseCampaign("campaign-1");
			expect(dbState.campaigns.get("campaign-1")?.status).toBe("PAUSED");

			const pausedBatch = await dispatch("campaign-1", {
				batchSize: 50,
				now: new Date("2026-09-16T01:00:00.000Z"),
			});
			expect(pausedBatch.sent).toBe(0);
			expect(sendEmail).not.toHaveBeenCalled();

			await resumeCampaign("campaign-1");
			expect(["QUEUED", "SENDING"]).toContain(dbState.campaigns.get("campaign-1")?.status);

			const resumed = await dispatch("campaign-1", {
				batchSize: 50,
				now: new Date("2026-09-16T01:00:00.000Z"),
			});
			expect(resumed.sent).toBe(50);
			expect(sendEmail).toHaveBeenCalledTimes(50);
			expect(
				sendEmail.mock.calls.every((call) => {
					const to = call[0]?.to as string;
					const index = Number(to.match(/user(\d+)@/)?.[1] ?? 0);
					return index > 400;
				}),
			).toBe(true);

			await cancelCampaign("campaign-1");
			expect(dbState.campaigns.get("campaign-1")?.status).toBe("CANCELLED");

			const afterCancel = await dispatch("campaign-1", {
				batchSize: 50,
				now: new Date("2026-09-16T01:05:00.000Z"),
			});
			expect(afterCancel.sent).toBe(0);
			expect(
				[...dbState.recipients.values()].filter((row) => row.status === "SENT"),
			).toHaveLength(450);
		});
	});

	describe("Rate-limited dispatch", () => {
		it("never sends more than ratePerMinute within a rolling 60-second window across batches", async () => {
			seedCampaign({
				status: "SENDING",
				totalRecipients: 200,
				sentCount: 0,
				sentCursor: 0,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				ratePerMinute: 60,
			});
			seedRecipients("campaign-1", 200);

			const firstWindow = new Date("2026-09-16T02:00:00.000Z");
			const first = await dispatch("campaign-1", {
				batchSize: 500,
				now: firstWindow,
			});
			expect(first.sent).toBe(60);
			expect(first.rateLimited).toBe(true);

			const second = await dispatch("campaign-1", {
				batchSize: 500,
				now: new Date("2026-09-16T02:00:30.000Z"),
			});
			expect(second.sent).toBe(0);
			expect(second.rateLimited).toBe(true);

			const third = await dispatch("campaign-1", {
				batchSize: 500,
				now: new Date("2026-09-16T02:01:00.000Z"),
			});
			expect(third.sent).toBe(60);
			expect(sendEmail).toHaveBeenCalledTimes(120);
		});
	});

	describe("Consent re-checked at dispatch time", () => {
		it("uses the business-layer consent gate by default", async () => {
			seedCampaign({
				type: "PROMO",
				status: "SENDING",
				totalRecipients: 1,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				ratePerMinute: 60,
			});
			seedRecipients("campaign-1", 1);

			const result = await dispatchCampaignBatch("campaign-1", {
				batchSize: 1,
				now: new Date("2026-09-16T02:59:00.000Z"),
			});

			expect(result.sent).toBe(1);
			expect(assertEmailConsent).toHaveBeenCalledWith("user-1", "marketing");
		});

		it("skips a recipient who loses consent after queueing", async () => {
			seedCampaign({
				type: "PROMO",
				status: "SENDING",
				totalRecipients: 2,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				ratePerMinute: 60,
			});
			seedRecipients("campaign-1", 2);

			assertEmailConsent.mockImplementation(async (userId: string) => {
				if (userId === "user-2") {
					return { allowed: false, reason: "marketing_consent_revoked" };
				}

				return { allowed: true };
			});

			const result = await dispatch("campaign-1", {
				batchSize: 10,
				now: new Date("2026-09-16T03:00:00.000Z"),
			});

			expect(result.sent).toBe(1);
			expect(result.skipped).toBe(1);
			expect(assertEmailConsent).toHaveBeenCalledWith("user-2", "marketing");
			expect(dbState.recipients.get("recipient-0002")?.status).toBe("SKIPPED");
			expect(sendEmail).toHaveBeenCalledTimes(1);
			expect(sendEmail.mock.calls[0]?.[0]?.to).toBe("user1@example.com");
		});

		it("skips a recipient without a userId instead of sending without consent", async () => {
			seedCampaign({
				status: "SENDING",
				totalRecipients: 1,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				ratePerMinute: 60,
			});
			const [recipient] = seedRecipients("campaign-1", 1);
			recipient!.userId = null;

			const result = await dispatch("campaign-1", {
				batchSize: 1,
				now: new Date("2026-09-16T03:06:00.000Z"),
			});

			expect(result.sent).toBe(0);
			expect(result.skipped).toBe(1);
			expect(dbState.recipients.get(recipient!.id)).toMatchObject({
				status: "SKIPPED",
				skipReason: "missing_user_id",
			});
			expect(result.completed).toBe(true);
			expect(assertEmailConsent).not.toHaveBeenCalled();
			expect(sendEmail).not.toHaveBeenCalled();
		});
	});

	describe("Atomic campaign counters", () => {
		it("preserves both sentCount increments for overlapping dispatches", async () => {
			seedCampaign({
				status: "SENDING",
				totalRecipients: 2,
				senderSnapshot: { provider: "tosend", mailFrom: "noreply@example.com" },
				ratePerMinute: 60,
			});
			seedRecipients("campaign-1", 2);

			const recipients = [...dbState.recipients.values()].sort((a, b) => a.id.localeCompare(b.id));
			vi.mocked(db.newsletterRecipient.findMany)
				.mockImplementationOnce(
					(async () => (recipients[0] ? [{ ...recipients[0] }] : [])) as never,
				)
				.mockImplementationOnce(
					(async () => (recipients[1] ? [{ ...recipients[1] }] : [])) as never,
				);

			let releaseSends!: () => void;
			const sendsReady = new Promise<void>((resolve) => {
				releaseSends = resolve;
			});
			let sendsStarted = 0;
			sendEmail.mockImplementation(async () => {
				sendsStarted += 1;
				if (sendsStarted === 2) {
					releaseSends();
				}
				await sendsReady;
				return true;
			});

			let releaseUpdates!: () => void;
			const updatesReady = new Promise<void>((resolve) => {
				releaseUpdates = resolve;
			});
			const applyCounterUpdate = ({
				where,
				data,
			}: {
				where: { id: string };
				data: CampaignUpdateData;
			}) => {
				const campaign = dbState.campaigns.get(where.id);
				if (!campaign) {
					throw new Error(`Campaign ${where.id} not found`);
				}

				applyCampaignUpdate(campaign, data);
				return cloneCampaign(campaign);
			};
			vi.mocked(db.newsletterCampaign.update)
				.mockImplementationOnce(
					(async (args: { where: { id: string }; data: CampaignUpdateData }) => {
						await updatesReady;
						return applyCounterUpdate(args);
					}) as never,
				)
				.mockImplementationOnce(
					(async (args: { where: { id: string }; data: CampaignUpdateData }) => {
						releaseUpdates();
						return applyCounterUpdate(args);
					}) as never,
				);

			const [first, second] = await Promise.all([
				dispatch("campaign-1", {
					batchSize: 1,
					now: new Date("2026-09-16T04:00:00.000Z"),
				}),
				dispatch("campaign-1", {
					batchSize: 1,
					now: new Date("2026-09-16T04:00:00.000Z"),
				}),
			]);

			expect(first.sent + second.sent).toBe(2);
			expect(dbState.campaigns.get("campaign-1")?.sentCount).toBe(2);
			expect(dbState.campaigns.get("campaign-1")?.sentCursor).toBe(2);
		});
	});

	describe("Zero eligible recipients blocks send", () => {
		it("blocks immediate send and schedule when no recipients are eligible", async () => {
			seedCampaign({ status: "DRAFT", totalRecipients: 0 });

			await expect(requestImmediateSend("campaign-1")).rejects.toThrow(/zero|no eligible|0 recipient/i);
			await expect(
				scheduleCampaign("campaign-1", new Date("2026-09-17T00:00:00.000Z")),
			).rejects.toThrow(/zero|no eligible|0 recipient/i);

			expect(dbState.campaigns.get("campaign-1")?.status).toBe("DRAFT");
		});
	});

	describe("Sender configuration snapshot locked at send time", () => {
		it("keeps using the snapshot captured when entering SENDING", async () => {
			seedCampaign({
				status: "QUEUED",
				totalRecipients: 2,
				ratePerMinute: 60,
			});
			seedRecipients("campaign-1", 2);

			const firstSnapshot = {
				provider: "tosend",
				mailFrom: "campaign@example.com",
				capturedAt: "2026-09-16T04:00:00.000Z",
			};

			await dispatch("campaign-1", {
				batchSize: 1,
				now: new Date("2026-09-16T04:00:00.000Z"),
				captureSenderSnapshot: async () => firstSnapshot,
			});

			expect(dbState.campaigns.get("campaign-1")?.status).toBe("SENDING");
			expect(dbState.campaigns.get("campaign-1")?.senderSnapshot).toEqual(firstSnapshot);
			expect(sendEmail).toHaveBeenCalledTimes(1);
			expect(sendEmail.mock.calls[0]?.[0]?.from).toBe("campaign@example.com");

			await dispatch("campaign-1", {
				batchSize: 1,
				now: new Date("2026-09-16T04:00:01.000Z"),
				captureSenderSnapshot: async () => ({
					provider: "resend",
					mailFrom: "changed@example.com",
					capturedAt: "2026-09-16T04:00:01.000Z",
				}),
			});

			expect(dbState.campaigns.get("campaign-1")?.senderSnapshot).toEqual(firstSnapshot);
			expect(sendEmail.mock.calls[1]?.[0]?.from).toBe("campaign@example.com");
		});
	});
});

describe("queueDueScheduledCampaigns", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dbState.campaigns.clear();
		dbState.recipients.clear();
		vi.mocked(db.newsletterCampaign.updateMany).mockImplementation(applyCampaignUpdateMany as never);
	});

	it("atomically queues a due SCHEDULED campaign only once under concurrent triggers", async () => {
		seedCampaign({
			status: "SCHEDULED",
			scheduledAt: new Date("2026-09-16T05:00:00.000Z"),
			totalRecipients: 3,
		});
		seedRecipients("campaign-1", 3);

		const campaign = dbState.campaigns.get("campaign-1")!;

		let entered = 0;
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});

		vi.mocked(db.newsletterCampaign.updateMany).mockImplementation(
			(async ({
				where,
				data,
			}: {
				where: { id?: string; status?: CampaignStatus | { in: CampaignStatus[] } };
				data: Partial<CampaignRecord>;
			}) => {
				entered += 1;
				if (entered === 1) {
					release();
					await new Promise((resolve) => setTimeout(resolve, 20));
				} else {
					await gate;
				}

				if (where.id && where.id !== campaign.id) {
					return { count: 0 };
				}

				if (!matchesStatus(campaign.status, where.status)) {
					return { count: 0 };
				}

				Object.assign(campaign, data);
				return { count: 1 };
			}) as never,
		);

		const now = new Date("2026-09-16T05:00:01.000Z");
		const [first, second] = await Promise.all([
			queueDueScheduledCampaigns(now),
			queueDueScheduledCampaigns(now),
		]);

		const queuedTotal = first.queued + second.queued;
		expect(queuedTotal).toBe(1);
		expect(campaign.status).toBe("QUEUED");
	});
});
