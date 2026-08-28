import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const missionFormValueFindMany = vi.hoisted(() => vi.fn());
const checkImpl = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: { missionFormValue: { findMany: missionFormValueFindMany } },
}));

vi.mock("@startkiter/course/src/course-pack/check-registry", () => ({
	checkRegistry: {
		deployment_heartbeat_fresh: checkImpl,
	},
	dispatchCheck: vi.fn(),
}));

import { auth } from "@startkiter/auth";

import { runMissionCheck } from "./run-mission-check";

describe("course.runMissionCheck", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "learner-1" },
			user: { id: "learner-1", email: "learner@example.com", role: "user" },
		} as never);
		missionFormValueFindMany.mockResolvedValue([]);
		checkImpl.mockResolvedValue({ status: "pending" });
	});

	it("rejects an unauthenticated check without executing any implementation", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		await expect(
			call(
				runMissionCheck,
				{
					coursePackMissionId: "mission-1",
					checkId: "deployment_heartbeat_fresh",
					params: {},
				},
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });

		expect(checkImpl).not.toHaveBeenCalled();
		expect(missionFormValueFindMany).not.toHaveBeenCalled();
	});
});
