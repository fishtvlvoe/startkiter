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

import { encryptMissionFormValue } from "../lib/mission-form-value-crypto";
import { runMissionCheck } from "./run-mission-check";

describe("course.runMissionCheck", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.SETTINGS_ENCRYPTION_KEY = "mission-value-test-key";
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

	it("returns unknown_check_id for an unregistered check without treating it as a failed learning attempt", async () => {
		await expect(
			call(
				runMissionCheck,
				{
					coursePackMissionId: "mission-1",
					checkId: "not_a_real_check",
					params: {},
				},
				{ context: { headers: new Headers() } },
			),
		).resolves.toEqual({
			status: "failed",
			reasonCode: "unknown_check_id",
		});

		expect(checkImpl).not.toHaveBeenCalled();
		expect(missionFormValueFindMany).not.toHaveBeenCalled();
	});

	it.each(["toString", "constructor"] as const)(
		"returns unknown_check_id for prototype property %s",
		async (checkId) => {
			await expect(
				call(
					runMissionCheck,
					{
						coursePackMissionId: "mission-1",
						checkId,
						params: {},
					},
					{ context: { headers: new Headers() } },
				),
			).resolves.toEqual({
				status: "failed",
				reasonCode: "unknown_check_id",
			});

			expect(checkImpl).not.toHaveBeenCalled();
			expect(missionFormValueFindMany).not.toHaveBeenCalled();
		},
	);

	it("dispatches a registered check_id with decrypted form values", async () => {
		missionFormValueFindMany.mockResolvedValue([
			{
				fieldKey: "bunnyApiKey",
				encryptedValue: encryptMissionFormValue("secret-value", "mission-value-test-key"),
			},
		]);
		checkImpl.mockResolvedValue({ status: "passed" });

		await expect(
			call(
				runMissionCheck,
				{
					coursePackMissionId: "mission-1",
					checkId: "deployment_heartbeat_fresh",
					params: { max_age_seconds: "300" },
				},
				{ context: { headers: new Headers() } },
			),
		).resolves.toEqual({ status: "passed" });

		expect(checkImpl).toHaveBeenCalledWith(
			{ max_age_seconds: "300" },
			{
				userId: "learner-1",
				coursePackMissionId: "mission-1",
				formValues: { bunnyApiKey: "secret-value" },
			},
		);
	});
});
