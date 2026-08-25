import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const coursePackFindMany = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: { coursePack: { findMany: coursePackFindMany } },
}));

import { auth } from "@startkiter/auth";

import { listCoursePacks } from "./list-course-packs";

const operatorSession = {
	session: { id: "session-1", userId: "operator-1" },
	user: { id: "operator-1", email: "operator@example.com", role: "user" },
};

describe("course.listCoursePacks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue(operatorSession as never);
	});

	it("returns imported packs newest first with mission counts", async () => {
		const importedAt = new Date("2026-08-25T06:00:00.000Z");
		coursePackFindMany.mockResolvedValue([
			{
				id: "pack-version-b",
				sourcePackId: "pack-b",
				title: "Pack B",
				status: "active",
				importedAt,
				_count: { missions: 2 },
			},
			{
				id: "pack-version-a",
				sourcePackId: "pack-a",
				title: "Pack A",
				status: "superseded",
				importedAt: new Date("2026-08-25T05:00:00.000Z"),
				_count: { missions: 1 },
			},
		]);

		await expect(call(listCoursePacks, {}, { context: { headers: new Headers() } })).resolves.toEqual([
			{
				id: "pack-version-b",
				sourcePackId: "pack-b",
				title: "Pack B",
				status: "active",
				missionCount: 2,
				importedAt: importedAt.toISOString(),
			},
			{
				id: "pack-version-a",
				sourcePackId: "pack-a",
				title: "Pack A",
				status: "superseded",
				missionCount: 1,
				importedAt: "2026-08-25T05:00:00.000Z",
			},
		]);

		expect(coursePackFindMany).toHaveBeenCalledWith({
			orderBy: { importedAt: "desc" },
			include: { _count: { select: { missions: true } } },
		});
	});

	it("returns an empty array when no packs have been imported", async () => {
		coursePackFindMany.mockResolvedValue([]);

		await expect(call(listCoursePacks, {}, { context: { headers: new Headers() } })).resolves.toEqual([]);
	});
});
