import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

type CampaignRow = {
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
};

type RecipientRow = {
	id: string;
	campaignId: string;
	userId: string | null;
	toEmail: string;
	status: RecipientStatus;
	skipReason: string | null;
	errorMessage: string | null;
	attemptCount: number;
	attemptToken: string | null;
	sentAt: Date | null;
	updatedAt: Date;
	createdAt: Date;
	isTest: boolean;
};

const { store, sendEmailMock, assertConsentMock, nowRef } = vi.hoisted(() => {
	const store = {
		campaigns: new Map<string, CampaignRow>(),
		recipients: new Map<string, RecipientRow>(),
	};

	return {
		store,
		sendEmailMock: vi.fn(async () => true),
		assertConsentMock: vi.fn(async () => ({ allowed: true as boolean, reason: undefined as string | undefined })),
		nowRef: { current: new Date("2026-09-16T03:00:00.000Z") },
	};
});

function matchesStatus(
	actual: CampaignStatus,
	expected: CampaignStatus | CampaignStatus[] | { in: CampaignStatus[] } | { notIn: CampaignStatus[] },
) {
	if (typeof expected === "string") return actual === expected;
	if (Array.isArray(expected)) return expected.includes(actual);
	if ("in" in expected) return expected.in.includes(actual);
	if ("notIn" in expected) return !expected.notIn.includes(actual);
	return false;
}

function applyIncrement(current: number, value: unknown) {
	if (value && typeof value === "object" && "increment" in value) {
		return current + Number((value as { increment: number }).increment);
	}
	return value as number;
}

vi.mock("@startkiter/database", () => ({
	db: {
		newsletterCampaign: {
			findUnique: vi.fn(async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) => {
				const row = store.campaigns.get(where.id) ?? null;
				if (!row || !select) return row;
				const picked: Record<string, unknown> = {};
				for (const key of Object.keys(select)) {
					if (select[key]) picked[key] = (row as Record<string, unknown>)[key];
				}
				return picked;
			}),
			findMany: vi.fn(async ({ where, take }: { where: { OR?: Array<Record<string, unknown>>; status?: CampaignStatus; scheduledAt?: { lte: Date } }; take?: number }) => {
				let rows = [...store.campaigns.values()];
				if (where.OR) {
					rows = rows.filter((row) =>
						where.OR!.some((clause) => {
							if (clause.status === "QUEUED") return row.status === "QUEUED";
							if (clause.status === "SENDING" && clause.lastHeartbeatAt && typeof clause.lastHeartbeatAt === "object" && "lt" in (clause.lastHeartbeatAt as object)) {
								const lt = (clause.lastHeartbeatAt as { lt: Date }).lt;
								return row.status === "SENDING" && !!row.lastHeartbeatAt && row.lastHeartbeatAt < lt;
							}
							return false;
						}),
					);
				}
				if (where.status) rows = rows.filter((r) => r.status === where.status);
				if (where.scheduledAt?.lte) {
					rows = rows.filter((r) => r.scheduledAt && r.scheduledAt <= where.scheduledAt!.lte);
				}
				return take ? rows.slice(0, take) : rows;
			}),
			updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
				let count = 0;
				for (const row of store.campaigns.values()) {
					if (where.id && row.id !== where.id) continue;
					if (where.status && !matchesStatus(row.status, where.status as never)) continue;
					if (where.OR) {
						const ok = (where.OR as Array<Record<string, unknown>>).some((clause) => {
							if (clause.status === "QUEUED") return row.status === "QUEUED";
							if (clause.status === "SENDING" && clause.lastHeartbeatAt && typeof clause.lastHeartbeatAt === "object" && "lt" in (clause.lastHeartbeatAt as object)) {
								const lt = (clause.lastHeartbeatAt as { lt: Date }).lt;
								return row.status === "SENDING" && !!row.lastHeartbeatAt && row.lastHeartbeatAt < lt;
							}
							return matchesStatus(row.status, clause.status as never);
						});
						if (!ok) continue;
					}
					if (where.scheduledAt && typeof where.scheduledAt === "object" && "lte" in (where.scheduledAt as object)) {
						const lte = (where.scheduledAt as { lte: Date }).lte;
						if (!(row.status === "SCHEDULED" && row.scheduledAt && row.scheduledAt <= lte)) continue;
					}
					for (const [key, value] of Object.entries(data)) {
						if (key === "sentCount" || key === "failedCount" || key === "skippedCount" || key === "sentCursor") {
							(row as Record<string, unknown>)[key] = applyIncrement((row as Record<string, number>)[key], value);
						} else {
							(row as Record<string, unknown>)[key] = value;
						}
					}
					count += 1;
				}
				return { count };
			}),
			update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
				const row = store.campaigns.get(where.id);
				if (!row) throw new Error("not found");
				for (const [key, value] of Object.entries(data)) {
					if (key === "sentCount" || key === "failedCount" || key === "skippedCount" || key === "sentCursor") {
						(row as Record<string, unknown>)[key] = applyIncrement((row as Record<string, number>)[key], value);
					} else {
						(row as Record<string, unknown>)[key] = value;
					}
				}
				return row;
			}),
		},
		newsletterRecipient: {
			findFirst: vi.fn(async ({ where, orderBy }: { where: Record<string, unknown>; orderBy?: { createdAt: "asc" | "desc" } }) => {
				let rows = [...store.recipients.values()].filter((r) => r.campaignId === where.campaignId);
				if (where.isTest === false) rows = rows.filter((r) => !r.isTest);
				if (where.status) {
					rows = rows.filter((r) => matchesStatus(r.status as never, where.status as never) || r.status === where.status);
				}
				if (where.OR) {
					rows = rows.filter((r) =>
						(where.OR as Array<Record<string, unknown>>).some((clause) => {
							if (clause.status === "PENDING") return r.status === "PENDING";
							if (clause.status === "PROCESSING" && clause.updatedAt && typeof clause.updatedAt === "object" && "lt" in (clause.updatedAt as object)) {
								return r.status === "PROCESSING" && r.updatedAt < (clause.updatedAt as { lt: Date }).lt;
							}
							if (clause.status === "FAILED" && clause.errorMessage === "provider_send_timeout") {
								return r.status === "FAILED" && r.errorMessage === "provider_send_timeout";
							}
							return r.status === clause.status;
						}),
					);
				}
				rows.sort((a, b) => (orderBy?.createdAt === "desc" ? b.createdAt.getTime() - a.createdAt.getTime() : a.createdAt.getTime() - b.createdAt.getTime()));
				return rows[0] ?? null;
			}),
			findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
				let rows = [...store.recipients.values()].filter((r) => r.campaignId === where.campaignId);
				if (where.status) {
					if (typeof where.status === "object" && where.status && "in" in (where.status as object)) {
						const allowed = (where.status as { in: RecipientStatus[] }).in;
						rows = rows.filter((r) => allowed.includes(r.status));
					} else {
						rows = rows.filter((r) => r.status === where.status);
					}
				}
				if (where.sentAt && typeof where.sentAt === "object" && "gte" in (where.sentAt as object)) {
					const gte = (where.sentAt as { gte: Date }).gte;
					rows = rows.filter((r) => r.sentAt && r.sentAt >= gte);
				}
				return rows;
			}),
			count: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
				let rows = [...store.recipients.values()].filter((r) => r.campaignId === where.campaignId);
				if (where.isTest === false) rows = rows.filter((r) => !r.isTest);
				if (where.status) rows = rows.filter((r) => r.status === where.status);
				if (where.errorMessage) rows = rows.filter((r) => r.errorMessage === where.errorMessage);
				if (where.updatedAt && typeof where.updatedAt === "object" && "gte" in (where.updatedAt as object)) {
					const gte = (where.updatedAt as { gte: Date }).gte;
					rows = rows.filter((r) => r.updatedAt >= gte);
				}
				if (where.sentAt && typeof where.sentAt === "object" && "gte" in (where.sentAt as object)) {
					const gte = (where.sentAt as { gte: Date }).gte;
					rows = rows.filter((r) => r.sentAt && r.sentAt >= gte);
				}
				return rows.length;
			}),
			groupBy: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
				let rows = [...store.recipients.values()].filter((r) => r.campaignId === where.campaignId);
				if (where.isTest === false) rows = rows.filter((r) => !r.isTest);
				const map = new Map<string, number>();
				for (const row of rows) map.set(row.status, (map.get(row.status) ?? 0) + 1);
				return [...map.entries()].map(([status, _count]) => ({ status, _count }));
			}),
			updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
				let count = 0;
				for (const row of store.recipients.values()) {
					if (typeof where.id === "string" && row.id !== where.id) continue;
					if (where.id && typeof where.id === "object" && "in" in (where.id as object)) {
						if (!(where.id as { in: string[] }).in.includes(row.id)) continue;
					}
					if (where.campaignId && row.campaignId !== where.campaignId) continue;

					const orClauses = where.OR as Array<Record<string, unknown>> | undefined;
					if (orClauses) {
						const ok = orClauses.some((clause) => {
							if (clause.status === "PENDING") return row.status === "PENDING";
							if (
								clause.status === "PROCESSING" &&
								clause.updatedAt &&
								typeof clause.updatedAt === "object" &&
								"lt" in (clause.updatedAt as object)
							) {
								return (
									row.status === "PROCESSING" &&
									row.updatedAt < (clause.updatedAt as { lt: Date }).lt
								);
							}
							if (clause.status === "FAILED" && clause.errorMessage === "provider_send_timeout") {
								return row.status === "FAILED" && row.errorMessage === "provider_send_timeout";
							}
							return row.status === clause.status;
						});
						if (!ok) continue;
					} else if (where.status && row.status !== where.status) {
						continue;
					}

					if (typeof where.attemptToken === "string" && row.attemptToken !== where.attemptToken) {
						continue;
					}

					for (const [key, value] of Object.entries(data)) {
						if (key === "attemptCount") {
							row.attemptCount = applyIncrement(row.attemptCount, value);
						} else {
							(row as Record<string, unknown>)[key] = value;
						}
					}
					row.updatedAt = nowRef.current;
					count += 1;
				}
				return { count };
			}),
		},
	},
}));

vi.mock("./email-consent", () => ({
	assertEmailConsent: assertConsentMock,
}));

vi.mock("@startkiter/mail", () => ({
	sendEmail: sendEmailMock,
}));

function seedCampaign(overrides: Partial<CampaignRow> = {}): CampaignRow {
	const row: CampaignRow = {
		id: overrides.id ?? "camp_1",
		type: overrides.type ?? "GENERAL",
		status: overrides.status ?? "DRAFT",
		scheduledAt: overrides.scheduledAt ?? null,
		ratePerMinute: overrides.ratePerMinute ?? 60,
		senderSnapshot: overrides.senderSnapshot ?? null,
		sentCursor: overrides.sentCursor ?? 0,
		totalRecipients: overrides.totalRecipients ?? 0,
		sentCount: overrides.sentCount ?? 0,
		failedCount: overrides.failedCount ?? 0,
		skippedCount: overrides.skippedCount ?? 0,
		lastHeartbeatAt: overrides.lastHeartbeatAt ?? null,
		snapshotAt: overrides.snapshotAt ?? null,
		subject: overrides.subject ?? "Hello",
		bodyHtml: overrides.bodyHtml ?? "<p>hi</p>",
		bodyText: overrides.bodyText ?? "hi",
	};
	store.campaigns.set(row.id, row);
	return row;
}

function seedRecipient(overrides: Partial<RecipientRow> & { id: string }): RecipientRow {
	const row: RecipientRow = {
		id: overrides.id,
		campaignId: overrides.campaignId ?? "camp_1",
		userId: "userId" in overrides ? overrides.userId ?? null : `user_${overrides.id}`,
		toEmail: overrides.toEmail ?? `${overrides.id}@example.com`,
		status: overrides.status ?? "PENDING",
		skipReason: overrides.skipReason ?? null,
		errorMessage: overrides.errorMessage ?? null,
		attemptCount: overrides.attemptCount ?? 0,
		attemptToken: overrides.attemptToken ?? null,
		sentAt: overrides.sentAt ?? null,
		updatedAt: overrides.updatedAt ?? nowRef.current,
		createdAt: overrides.createdAt ?? nowRef.current,
		isTest: overrides.isTest ?? false,
	};
	store.recipients.set(row.id, row);
	return row;
}

const snapshot = {
	fromEmail: "noreply@startkiter.dev",
	senderName: "StartKiter",
	emailProvider: "smtp",
	capturedAt: "2026-09-16T03:00:00.000Z",
};

describe("newsletter send-engine", () => {
	beforeEach(() => {
		store.campaigns.clear();
		store.recipients.clear();
		sendEmailMock.mockReset();
		sendEmailMock.mockResolvedValue(true);
		assertConsentMock.mockReset();
		assertConsentMock.mockResolvedValue({ allowed: true });
		nowRef.current = new Date("2026-09-16T03:00:00.000Z");
		vi.resetModules();
	});

	afterEach(async () => {
		vi.useRealTimers();
		vi.resetModules();
		try {
			const engine = await import("./send-engine");
			engine.sendEngineConfig.providerSendTimeoutMs = 30_000;
			engine.sendEngineConfig.leaseHeartbeatIntervalMs = 15_000;
			engine.sendEngineClock.now = () => new Date();
		} catch {
			// module may already be torn down
		}
	});

	describe("Campaign state machine with atomic transitions", () => {
		it("double-click on immediate send only succeeds once", async () => {
			seedCampaign({ id: "camp_dbl", status: "DRAFT", totalRecipients: 2 });
			seedRecipient({ id: "r1", campaignId: "camp_dbl" });
			seedRecipient({ id: "r2", campaignId: "camp_dbl" });

			const { startCampaignSend } = await import("./send-engine");
			const [a, b] = await Promise.allSettled([
				startCampaignSend({ campaignId: "camp_dbl", senderSnapshot: snapshot, eligibleRecipientCount: 2 }),
				startCampaignSend({ campaignId: "camp_dbl", senderSnapshot: snapshot, eligibleRecipientCount: 2 }),
			]);

			const fulfilled = [a, b].filter((r) => r.status === "fulfilled");
			const rejected = [a, b].filter((r) => r.status === "rejected");
			expect(fulfilled).toHaveLength(1);
			expect(rejected).toHaveLength(1);
			expect(store.campaigns.get("camp_dbl")?.status).toBe("QUEUED");
		});

		it("rejects reverting terminal SENT/FAILED/CANCELLED back to DRAFT or SCHEDULED", async () => {
			seedCampaign({ id: "camp_term", status: "SENT" });
			const { transitionCampaignStatus, SendEngineError } = await import("./send-engine");

			await expect(
				transitionCampaignStatus({
					campaignId: "camp_term",
					from: ["SENT", "FAILED", "CANCELLED"],
					to: "DRAFT",
				}),
			).rejects.toBeInstanceOf(SendEngineError);

			expect(store.campaigns.get("camp_term")?.status).toBe("SENT");
		});
	});

	describe("Idempotent recipient dispatch with resume / Pause resume cancel", () => {
		it("container restart mid-campaign continues from PENDING and does not re-send SENT", async () => {
			seedCampaign({
				id: "camp_resume",
				status: "SENDING",
				senderSnapshot: snapshot,
				ratePerMinute: 1000,
				totalRecipients: 5,
				sentCount: 3,
				lastHeartbeatAt: new Date("2026-09-16T02:50:00.000Z"),
			});
			for (let i = 1; i <= 3; i++) {
				seedRecipient({
					id: `sent_${i}`,
					campaignId: "camp_resume",
					status: "SENT",
					sentAt: new Date("2026-09-16T02:51:00.000Z"),
					createdAt: new Date(Date.UTC(2026, 8, 16, 2, 50, i)),
				});
			}
			for (let i = 4; i <= 5; i++) {
				seedRecipient({
					id: `pending_${i}`,
					campaignId: "camp_resume",
					status: "PENDING",
					createdAt: new Date(Date.UTC(2026, 8, 16, 2, 50, i)),
				});
			}

			const { processCampaignDispatch } = await import("./send-engine");
			const result = await processCampaignDispatch("camp_resume", { maxSends: 10 });

			expect(result.sent).toBe(2);
			expect(sendEmailMock).toHaveBeenCalledTimes(2);
			expect(store.recipients.get("sent_1")?.status).toBe("SENT");
			expect(store.recipients.get("pending_4")?.status).toBe("SENT");
			expect(store.recipients.get("pending_5")?.status).toBe("SENT");
			expect(store.campaigns.get("camp_resume")?.status).toBe("SENT");
		});

		it("pause then resume continues without re-sending completed recipients", async () => {
			seedCampaign({
				id: "camp_pause",
				status: "SENDING",
				senderSnapshot: snapshot,
				ratePerMinute: 1000,
				totalRecipients: 4,
				sentCount: 2,
			});
			seedRecipient({ id: "p1", campaignId: "camp_pause", status: "SENT", sentAt: nowRef.current, createdAt: new Date("2026-09-16T02:00:01.000Z") });
			seedRecipient({ id: "p2", campaignId: "camp_pause", status: "SENT", sentAt: nowRef.current, createdAt: new Date("2026-09-16T02:00:02.000Z") });
			seedRecipient({ id: "p3", campaignId: "camp_pause", status: "PENDING", createdAt: new Date("2026-09-16T02:00:03.000Z") });
			seedRecipient({ id: "p4", campaignId: "camp_pause", status: "PENDING", createdAt: new Date("2026-09-16T02:00:04.000Z") });

			const { pauseCampaign, resumeCampaign, processCampaignDispatch } = await import("./send-engine");
			await pauseCampaign("camp_pause");
			expect(store.campaigns.get("camp_pause")?.status).toBe("PAUSED");

			await resumeCampaign("camp_pause");
			expect(store.campaigns.get("camp_pause")?.status).toBe("QUEUED");

			// claim into SENDING then process
			store.campaigns.get("camp_pause")!.status = "SENDING";
			const result = await processCampaignDispatch("camp_pause", { maxSends: 10 });
			expect(result.sent).toBe(2);
			expect(sendEmailMock).toHaveBeenCalledTimes(2);
			expect(store.recipients.get("p1")?.status).toBe("SENT");
			expect(store.recipients.get("p3")?.status).toBe("SENT");
		});

		it("cancel stops further sends while preserving already-sent recipients", async () => {
			seedCampaign({ id: "camp_cancel", status: "SENDING", senderSnapshot: snapshot });
			seedRecipient({ id: "c1", campaignId: "camp_cancel", status: "SENT", sentAt: nowRef.current });
			seedRecipient({ id: "c2", campaignId: "camp_cancel", status: "PENDING" });

			const { cancelCampaign, processCampaignDispatch } = await import("./send-engine");
			await cancelCampaign("camp_cancel");
			expect(store.campaigns.get("camp_cancel")?.status).toBe("CANCELLED");

			const result = await processCampaignDispatch("camp_cancel", { maxSends: 10 });
			expect(result.sent).toBe(0);
			expect(sendEmailMock).not.toHaveBeenCalled();
			expect(store.recipients.get("c1")?.status).toBe("SENT");
			expect(store.recipients.get("c2")?.status).toBe("PENDING");
		});
	});

	describe("Rate limit, consent re-check, zero recipients, senderSnapshot lock", () => {
		it("rate limit spans multiple dispatch batches within a rolling 60s window", async () => {
			seedCampaign({
				id: "camp_rate",
				status: "SENDING",
				senderSnapshot: snapshot,
				ratePerMinute: 2,
				totalRecipients: 5,
			});
			for (let i = 1; i <= 5; i++) {
				seedRecipient({
					id: `rate_${i}`,
					campaignId: "camp_rate",
					status: "PENDING",
					createdAt: new Date(Date.UTC(2026, 8, 16, 3, 0, i)),
				});
			}

			const engine = await import("./send-engine");
			engine.sendEngineClock.now = () => nowRef.current;

			const first = await engine.processCampaignDispatch("camp_rate", { maxSends: 10 });
			expect(first.sent).toBe(2);
			expect(sendEmailMock).toHaveBeenCalledTimes(2);

			const second = await engine.processCampaignDispatch("camp_rate", { maxSends: 10 });
			expect(second.sent).toBe(0);
			expect(sendEmailMock).toHaveBeenCalledTimes(2);

			nowRef.current = new Date("2026-09-16T03:01:01.000Z");
			const third = await engine.processCampaignDispatch("camp_rate", { maxSends: 10 });
			expect(third.sent).toBe(2);
			expect(sendEmailMock).toHaveBeenCalledTimes(4);
		});

		it("re-checks consent at dispatch time and skips unsubscribed recipients", async () => {
			seedCampaign({
				id: "camp_consent",
				status: "SENDING",
				type: "PROMO",
				senderSnapshot: snapshot,
				ratePerMinute: 100,
				totalRecipients: 2,
			});
			seedRecipient({ id: "ok", campaignId: "camp_consent", userId: "u_ok", createdAt: new Date("2026-09-16T03:00:01.000Z") });
			seedRecipient({ id: "no", campaignId: "camp_consent", userId: "u_no", createdAt: new Date("2026-09-16T03:00:02.000Z") });

			assertConsentMock.mockImplementation(async (userId: string) => {
				if (userId === "u_no") return { allowed: false, reason: "marketing_consent_missing" };
				return { allowed: true };
			});

			const { processCampaignDispatch } = await import("./send-engine");
			const result = await processCampaignDispatch("camp_consent", { maxSends: 10 });

			expect(assertConsentMock).toHaveBeenCalled();
			expect(result.skipped).toBe(1);
			expect(result.sent).toBe(1);
			expect(store.recipients.get("no")?.status).toBe("SKIPPED");
			expect(sendEmailMock).toHaveBeenCalledTimes(1);
		});

		it("blocks send when eligible recipient count is zero", async () => {
			seedCampaign({ id: "camp_zero", status: "DRAFT", totalRecipients: 0 });
			const { startCampaignSend, SendEngineError } = await import("./send-engine");

			await expect(
				startCampaignSend({
					campaignId: "camp_zero",
					senderSnapshot: snapshot,
					eligibleRecipientCount: 0,
				}),
			).rejects.toMatchObject({ code: "ZERO_RECIPIENTS" });

			expect(store.campaigns.get("camp_zero")?.status).toBe("DRAFT");
			void SendEngineError;
		});

		it("keeps locked senderSnapshot when global provider changes mid-send", async () => {
			const locked = { ...snapshot, emailProvider: "smtp", fromEmail: "locked@startkiter.dev" };
			seedCampaign({
				id: "camp_snap",
				status: "SENDING",
				senderSnapshot: locked,
				ratePerMinute: 100,
				totalRecipients: 1,
			});
			seedRecipient({ id: "s1", campaignId: "camp_snap" });

			const { processCampaignDispatch } = await import("./send-engine");
			await processCampaignDispatch("camp_snap", { maxSends: 1 });

			expect(store.campaigns.get("camp_snap")?.senderSnapshot).toEqual(locked);
			expect(sendEmailMock).toHaveBeenCalledWith(
				expect.objectContaining({
					from: "locked@startkiter.dev",
				}),
			);
		});
	});

	describe("Cron atomic scheduling transitions", () => {
		it("near-simultaneous queueDueCampaigns only transitions SCHEDULED → QUEUED once", async () => {
			seedCampaign({
				id: "camp_sched",
				status: "SCHEDULED",
				scheduledAt: new Date("2020-01-01T00:00:00.000Z"),
				totalRecipients: 1,
				senderSnapshot: snapshot,
			});

			const { queueDueCampaigns } = await import("./send-engine");
			const [a, b] = await Promise.all([queueDueCampaigns(), queueDueCampaigns()]);
			expect(a.queued + b.queued).toBe(1);
			expect(store.campaigns.get("camp_sched")?.status).toBe("QUEUED");
		});
	});

	describe("Critical: null userId and attempt lease token", () => {
		it("fail-closes non-test recipients with null userId without calling sendEmail", async () => {
			seedCampaign({
				id: "camp_null_user",
				status: "SENDING",
				senderSnapshot: snapshot,
				ratePerMinute: 100,
				totalRecipients: 1,
			});
			seedRecipient({
				id: "anon",
				campaignId: "camp_null_user",
				userId: null,
				toEmail: "unconsented@example.com",
				isTest: false,
			});

			const { processCampaignDispatch } = await import("./send-engine");
			const result = await processCampaignDispatch("camp_null_user", { maxSends: 5 });

			expect(sendEmailMock).not.toHaveBeenCalled();
			expect(assertConsentMock).not.toHaveBeenCalled();
			expect(result.skipped).toBe(1);
			expect(result.sent).toBe(0);
			expect(store.recipients.get("anon")?.status).toBe("SKIPPED");
			expect(store.recipients.get("anon")?.skipReason).toBe("missing_user_identity");
		});

		it("does not reclaim a PROCESSING recipient before the lease expires", async () => {
			seedCampaign({
				id: "camp_lease_fresh",
				status: "SENDING",
				senderSnapshot: snapshot,
				ratePerMinute: 100,
				totalRecipients: 1,
				sentCount: 0,
			});
			seedRecipient({
				id: "leased",
				campaignId: "camp_lease_fresh",
				userId: "u1",
				status: "PROCESSING",
				attemptToken: "token-worker-a",
				attemptCount: 1,
				updatedAt: nowRef.current,
			});

			sendEmailMock.mockImplementation(async () => {
				throw new Error("should not send");
			});

			const engine = await import("./send-engine");
			engine.sendEngineClock.now = () => nowRef.current;
			const result = await engine.processCampaignDispatch("camp_lease_fresh", { maxSends: 5 });

			expect(result.sent).toBe(0);
			expect(sendEmailMock).not.toHaveBeenCalled();
			expect(store.recipients.get("leased")?.attemptToken).toBe("token-worker-a");
			expect(store.campaigns.get("camp_lease_fresh")?.sentCount).toBe(0);
		});

		it("stale-lease reclaim uses a new attemptToken so the old worker cannot double-count sentCount", async () => {
			seedCampaign({
				id: "camp_stale",
				status: "SENDING",
				senderSnapshot: snapshot,
				ratePerMinute: 100,
				totalRecipients: 1,
				sentCount: 0,
			});
			const staleAt = new Date(nowRef.current.getTime() - 3 * 60_000);
			seedRecipient({
				id: "stale_r",
				campaignId: "camp_stale",
				userId: "u_stale",
				status: "PROCESSING",
				attemptToken: "token-old",
				attemptCount: 1,
				updatedAt: staleAt,
				createdAt: staleAt,
			});

			const engine = await import("./send-engine");
			engine.sendEngineClock.now = () => nowRef.current;

			const result = await engine.processCampaignDispatch("camp_stale", { maxSends: 1 });
			expect(result.sent).toBe(1);
			expect(sendEmailMock).toHaveBeenCalledTimes(1);
			expect(store.recipients.get("stale_r")?.status).toBe("SENT");
			expect(store.recipients.get("stale_r")?.attemptToken).not.toBe("token-old");
			expect(store.campaigns.get("camp_stale")?.sentCount).toBe(1);

			// 舊 worker 以舊 token 嘗試 finalize → no-op，不可再加 sentCount
			const late = await store.recipients.get("stale_r")!;
			const lateUpdate = await (
				await import("@startkiter/database")
			).db.newsletterRecipient.updateMany({
				where: { id: late.id, status: "PROCESSING", attemptToken: "token-old" },
				data: { status: "SENT", sentAt: nowRef.current },
			});
			expect(lateUpdate.count).toBe(0);
			expect(store.campaigns.get("camp_stale")?.sentCount).toBe(1);
		});
	});

	describe("Critical: in-flight provider call must not be reclaimed", () => {
		it("keeps lease alive via heartbeat past 2 minutes, times out send, then allows one reclaim send", async () => {
			vi.useFakeTimers();
			try {
				seedCampaign({
					id: "camp_inflight",
					status: "SENDING",
					senderSnapshot: snapshot,
					ratePerMinute: 100,
					totalRecipients: 1,
					sentCount: 0,
					failedCount: 0,
				});
				seedRecipient({
					id: "inflight_r",
					campaignId: "camp_inflight",
					userId: "u_inflight",
					status: "PENDING",
					createdAt: nowRef.current,
				});

				let sendCalls = 0;
				sendEmailMock.mockImplementation(
					() =>
						new Promise<boolean>(() => {
							sendCalls += 1;
						}),
				);

				const engine = await import("./send-engine");
				engine.sendEngineClock.now = () => nowRef.current;
				engine.sendEngineConfig.providerSendTimeoutMs = 30_000;
				engine.sendEngineConfig.leaseHeartbeatIntervalMs = 10_000;

				const workerA = engine.processCampaignDispatch("camp_inflight", { maxSends: 1 });

				await vi.advanceTimersByTimeAsync(0);
				await Promise.resolve();
				await Promise.resolve();

				expect(store.recipients.get("inflight_r")?.status).toBe("PROCESSING");
				expect(sendCalls).toBe(1);
				const tokenA = store.recipients.get("inflight_r")?.attemptToken;
				expect(tokenA).toBeTruthy();

				nowRef.current = new Date(nowRef.current.getTime() + 3 * 60_000);
				await vi.advanceTimersByTimeAsync(10_000);
				await Promise.resolve();

				expect(store.recipients.get("inflight_r")?.updatedAt.getTime()).toBe(
					nowRef.current.getTime(),
				);

				const workerBDuringA = await engine.processCampaignDispatch("camp_inflight", {
					maxSends: 1,
				});
				expect(workerBDuringA.sent).toBe(0);
				expect(workerBDuringA.failed).toBe(0);
				expect(sendCalls).toBe(1);
				expect(store.recipients.get("inflight_r")?.attemptToken).toBe(tokenA);

				await vi.advanceTimersByTimeAsync(30_000);
				const aResult = await workerA;
				expect(aResult.failed).toBe(1);
				expect(store.recipients.get("inflight_r")?.status).toBe("FAILED");
				expect(store.recipients.get("inflight_r")?.errorMessage).toBe("provider_send_timeout");

				sendEmailMock.mockImplementation(async () => {
					sendCalls += 1;
					return true;
				});
				const workerBAfter = await engine.processCampaignDispatch("camp_inflight", {
					maxSends: 1,
				});
				expect(workerBAfter.sent).toBe(1);
				expect(sendCalls).toBe(2);
				expect(store.recipients.get("inflight_r")?.status).toBe("SENT");
				expect(store.campaigns.get("camp_inflight")?.sentCount).toBe(1);
			} finally {
				vi.useRealTimers();
				const engine = await import("./send-engine");
				engine.sendEngineConfig.providerSendTimeoutMs = 30_000;
				engine.sendEngineConfig.leaseHeartbeatIntervalMs = 15_000;
			}
		});
	});
});
