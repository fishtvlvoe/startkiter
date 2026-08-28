import { afterEach, describe, expect, it, vi } from "vitest";

import type { CheckContext } from "../check-registry";
import { createDeploymentHeartbeatFreshCheck } from "./deployment-heartbeat-fresh";

const context: CheckContext = {
	userId: "learner-1",
	coursePackMissionId: "mission-1",
	formValues: {},
};

describe("deployment_heartbeat_fresh", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns passed when the latest heartbeat is within the max age", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-28T12:00:00.000Z"));

		const check = createDeploymentHeartbeatFreshCheck({
			findLatestForUser: async () => ({
				receivedAt: new Date("2026-08-28T11:59:50.000Z"),
			}),
		});

		await expect(check({ max_age_seconds: "60" }, context)).resolves.toEqual({
			status: "passed",
		});
	});

	it("returns pending when heartbeat data is missing", async () => {
		const findLatestForUser = vi.fn().mockResolvedValue(null);
		const check = createDeploymentHeartbeatFreshCheck({ findLatestForUser });

		await expect(check({ max_age_seconds: "60" }, context)).resolves.toEqual({
			status: "pending",
		});
		expect(findLatestForUser).toHaveBeenCalledWith("learner-1");
	});

	it("returns pending when the latest heartbeat is older than the max age", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-28T12:00:00.000Z"));

		const check = createDeploymentHeartbeatFreshCheck({
			findLatestForUser: async () => ({
				receivedAt: new Date("2026-08-28T11:50:00.000Z"),
			}),
		});

		await expect(check({ max_age_seconds: "60" }, context)).resolves.toEqual({
			status: "pending",
		});
	});
});
