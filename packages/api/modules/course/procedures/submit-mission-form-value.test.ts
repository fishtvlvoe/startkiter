import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const missionFormValueUpsert = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: { missionFormValue: { upsert: missionFormValueUpsert } },
}));

import { auth } from "@startkiter/auth";

import { submitMissionFormValue } from "./submit-mission-form-value";

	describe("course.submitMissionFormValue", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.SETTINGS_ENCRYPTION_KEY = "mission-value-test-key";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "learner-1" },
			user: { id: "learner-1", email: "learner@example.com", role: "user" },
		} as never);
		missionFormValueUpsert.mockResolvedValue({ id: "value-1" });
	});

	it("rejects an unauthenticated submission without writing a value", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		await expect(
			call(
				submitMissionFormValue,
				{ coursePackMissionId: "mission-1", fieldKey: "bunnyApiKey", value: "secret-value" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });

		expect(missionFormValueUpsert).not.toHaveBeenCalled();
	});

	it("encrypts and upserts a value scoped to the authenticated user, mission, and field", async () => {
		await expect(
			call(
				submitMissionFormValue,
				{ coursePackMissionId: "mission-1", fieldKey: "bunnyApiKey", value: "secret-value" },
				{ context: { headers: new Headers() } },
			),
		).resolves.toEqual({ success: true });

		expect(missionFormValueUpsert).toHaveBeenCalledWith({
			where: {
				userId_coursePackMissionId_fieldKey: {
					userId: "learner-1",
					coursePackMissionId: "mission-1",
					fieldKey: "bunnyApiKey",
				},
			},
			create: {
				userId: "learner-1",
				coursePackMissionId: "mission-1",
				fieldKey: "bunnyApiKey",
				encryptedValue: expect.stringMatching(/^v1:/),
			},
			update: { encryptedValue: expect.stringMatching(/^v1:/) },
		});

		const encryptedValue = missionFormValueUpsert.mock.calls[0]?.[0].create.encryptedValue;
		expect(encryptedValue).not.toContain("secret-value");
	});
});
