import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		$executeRaw: vi.fn(() => Promise.resolve(1)),
		lessonProgress: {
			update: vi.fn(),
			upsert: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { recordWatchTime } from "./record-watch-time";

describe("course.recordWatchTime", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "learner-1" },
			user: { id: "learner-1", email: "learner@example.com", role: "user" },
		} as never);
	});

	it("uses an atomic greatest update for the caller's own lesson record", async () => {
		await expect(
			call(
				recordWatchTime,
				{ lessonId: "lesson-1", watchedSec: 330 },
				{ context: { headers: new Headers() } },
			),
		).resolves.toEqual({ recorded: true });

		expect(db.$executeRaw).toHaveBeenCalledTimes(1);
		const upsertSql = vi.mocked(db.$executeRaw).mock.calls[0]?.[0];
		expect(String(upsertSql)).toContain("GREATEST");
		expect(vi.mocked(db.$executeRaw).mock.calls[0]?.slice(1)).toContain("learner-1");
		expect(vi.mocked(db.$executeRaw).mock.calls[0]?.slice(1)).toContain("lesson-1");
		expect(db.lessonProgress.update).not.toHaveBeenCalled();
		expect(db.lessonProgress.upsert).not.toHaveBeenCalled();
	});

	it("rejects an unauthenticated report without writing a record", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		await expect(
			call(
				recordWatchTime,
				{ lessonId: "lesson-1", watchedSec: 30 },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });

		expect(db.$executeRaw).not.toHaveBeenCalled();
	});
});
