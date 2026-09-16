import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({
	findMany: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findMany },
	},
}));

import {
	buildAudienceWhere,
	countSelectedRecipients,
	createDebouncedAudienceEstimator,
	estimateAudience,
	parseSegmentJson,
	resolveDispatchRecipients,
	type AudienceUserRow,
	type SegmentJson,
} from "./audience";

function userRow(overrides: Partial<AudienceUserRow> = {}): AudienceUserRow {
	return {
		id: "user-1",
		name: "Learner",
		email: "learner@example.com",
		role: "USER",
		marketingConsent: true,
		generalEmailConsent: true,
		unsubscribedAt: null,
		emailInvalidAt: null,
		emailBounceState: "NONE",
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		...overrides,
	};
}

describe("parseSegmentJson / buildAudienceWhere", () => {
	it("builds a single-layer AND where for course + activity conditions", () => {
		const segment = parseSegmentJson({
			mode: "AND",
			rules: [
				{ field: "coursePurchased", value: "course-x" },
				{ field: "lastLoginWithinDays", value: 30 },
			],
		});

		const where = buildAudienceWhere(segment);
		expect(where).toMatchObject({
			AND: expect.arrayContaining([
				expect.objectContaining({
					courseSubscriptions: {
						some: { courseId: "course-x", status: "ACTIVE" },
					},
				}),
				expect.objectContaining({
					sessions: {
						some: {
							updatedAt: expect.objectContaining({ gte: expect.any(Date) }),
						},
					},
				}),
			]),
		});
		expect(JSON.stringify(where)).not.toMatch(/"AND".*"AND"/);
	});

	it("builds a single-layer OR where without nested groups", () => {
		const where = buildAudienceWhere({
			mode: "OR",
			rules: [
				{ field: "coursePurchased", value: "course-a" },
				{ field: "coursePurchased", value: "course-b" },
			],
		});

		expect(where).toEqual({
			OR: [
				{ courseSubscriptions: { some: { courseId: "course-a", status: "ACTIVE" } } },
				{ courseSubscriptions: { some: { courseId: "course-b", status: "ACTIVE" } } },
			],
		});
	});
});

describe("estimateAudience", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports a live deduplicated OR estimate (200 ∪ 150 − 80 = 270)", async () => {
		const users: AudienceUserRow[] = [];
		for (let i = 0; i < 120; i++) {
			users.push(userRow({ id: `only-a-${i}`, email: `a${i}@example.com` }));
		}
		for (let i = 0; i < 70; i++) {
			users.push(userRow({ id: `only-b-${i}`, email: `b${i}@example.com` }));
		}
		for (let i = 0; i < 80; i++) {
			users.push(userRow({ id: `both-${i}`, email: `both${i}@example.com` }));
		}
		findMany.mockResolvedValue(users);

		const estimate = await estimateAudience({
			type: "GENERAL",
			segment: {
				mode: "OR",
				rules: [
					{ field: "coursePurchased", value: "course-a" },
					{ field: "coursePurchased", value: "course-b" },
				],
			},
		});

		expect(estimate.sendable).toBe(270);
		expect(estimate.matched).toBe(270);
	});

	it("excludes unsubscribed and invalid emails from the estimate", async () => {
		findMany.mockResolvedValue([
			userRow({ id: "ok", email: "ok@example.com" }),
			userRow({
				id: "unsub",
				email: "unsub@example.com",
				unsubscribedAt: new Date("2026-09-01T00:00:00.000Z"),
			}),
			userRow({
				id: "invalid",
				email: "bad@example.com",
				emailInvalidAt: new Date("2026-09-01T00:00:00.000Z"),
			}),
		]);

		const estimate = await estimateAudience({
			type: "GENERAL",
			segment: { preset: "all" },
		});

		expect(estimate.sendable).toBe(1);
		expect(estimate.excluded.unsubscribed).toBe(1);
		expect(estimate.excluded.invalid).toBe(1);
		expect(estimate.recipients?.map((r) => r.email)).toEqual(["ok@example.com"]);
	});

	it("deduplicates by normalized email across overlapping matches", async () => {
		findMany.mockResolvedValue([
			userRow({ id: "u1", email: "Same@Example.com" }),
			userRow({ id: "u2", email: "same@example.com" }),
		]);

		const estimate = await estimateAudience({
			type: "GENERAL",
			segment: {
				mode: "AND",
				rules: [
					{ field: "coursePurchased", value: "course-a" },
					{ field: "coursePurchased", value: "course-b" },
				],
			},
		});

		expect(estimate.sendable).toBe(1);
		expect(estimate.recipients).toHaveLength(1);
		expect(estimate.recipients?.[0]?.email).toBe("same@example.com");
	});

	it("debounces live estimate recomputation after condition changes", async () => {
		vi.useFakeTimers();
		findMany.mockResolvedValue([userRow()]);

		const run = vi.fn(async (segment: SegmentJson) =>
			estimateAudience({ type: "GENERAL", segment }),
		);
		const debounced = createDebouncedAudienceEstimator(run, 300);

		void debounced({ preset: "all" });
		void debounced({
			mode: "OR",
			rules: [{ field: "role", value: "USER" }],
		});

		expect(run).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(300);
		expect(run).toHaveBeenCalledTimes(1);
		expect(run).toHaveBeenCalledWith({
			mode: "OR",
			rules: [{ field: "role", value: "USER" }],
		});
	});
});

describe("resolveDispatchRecipients", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("recomputes the audience at dispatch instead of reusing a creation-time snapshot", async () => {
		const creationSnapshot = [
			userRow({ id: "still-ok", email: "ok@example.com" }),
			userRow({ id: "will-unsub", email: "later@example.com" }),
		];

		findMany.mockResolvedValueOnce(creationSnapshot);
		const estimate = await estimateAudience({
			type: "GENERAL",
			segment: { preset: "all" },
		});
		expect(estimate.sendable).toBe(2);

		findMany.mockResolvedValueOnce([
			userRow({ id: "still-ok", email: "ok@example.com" }),
			userRow({
				id: "will-unsub",
				email: "later@example.com",
				unsubscribedAt: new Date("2026-09-16T00:00:00.000Z"),
			}),
		]);

		const dispatched = await resolveDispatchRecipients({
			type: "GENERAL",
			segment: { preset: "all" },
		});

		expect(dispatched.map((r) => r.email)).toEqual(["ok@example.com"]);
		expect(dispatched).toHaveLength(1);
		expect(findMany).toHaveBeenCalledTimes(2);
	});
});

describe("send to all or manually selected recipients", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("supports sending to the entire eligible base via preset all", async () => {
		findMany.mockResolvedValue([
			userRow({ id: "a", email: "a@example.com" }),
			userRow({ id: "b", email: "b@example.com" }),
		]);

		const where = buildAudienceWhere({ preset: "all" });
		expect(where).toEqual({});

		const estimate = await estimateAudience({
			type: "GENERAL",
			segment: { preset: "all" },
		});
		expect(estimate.sendable).toBe(2);
	});

	it("supports manual selection and exposes the selected count", async () => {
		findMany.mockResolvedValue([
			userRow({ id: "u1", email: "one@example.com" }),
			userRow({ id: "u2", email: "two@example.com" }),
		]);

		const segment: SegmentJson = {
			preset: "manual",
			manualUserIds: ["u1", "u2"],
		};
		expect(countSelectedRecipients(segment)).toBe(2);

		const estimate = await estimateAudience({
			type: "GENERAL",
			segment,
		});
		expect(estimate.sendable).toBe(2);
		expect(buildAudienceWhere(segment)).toEqual({
			id: { in: ["u1", "u2"] },
		});
	});
});
