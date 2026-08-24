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
		courseOnboardingSurveyResponse: {
			create: vi.fn(),
		},
	},
}));

vi.mock("../lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { userCanAccessCourseId } from "../lib/course-access";
import { submitOnboardingSurvey } from "./submit-onboarding-survey";

const response = {
	goals: ["轉職"],
	purchaseFactors: ["實作導向"],
	hesitation: "怕跟不上",
	alternatives: "YouTube",
	discoverySource: "朋友推薦",
	discoverySourceOther: null,
};

describe("course.submitOnboardingSurvey", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "learner-1" },
			user: { id: "learner-1", email: "learner@example.com", role: "user" },
		} as never);
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);
		vi.mocked(db.courseOnboardingSurveyResponse.create).mockResolvedValue({
			id: "survey-1",
		} as never);
	});

	it("allows an enrolled learner to submit one survey", async () => {
		await expect(
			call(
				submitOnboardingSurvey,
				{ courseId: "course-1", response },
				{ context: { headers: new Headers() } },
			),
		).resolves.toEqual({ submitted: true });

		expect(userCanAccessCourseId).toHaveBeenCalledWith("learner-1", "course-1");
		expect(db.courseOnboardingSurveyResponse.create).toHaveBeenCalledWith({
			data: {
				userId: "learner-1",
				courseId: "course-1",
				...response,
			},
		});
	});

	it("rejects a duplicate submission at the database unique constraint", async () => {
		vi.mocked(db.courseOnboardingSurveyResponse.create).mockRejectedValue({ code: "P2002" });

		await expect(
			call(
				submitOnboardingSurvey,
				{ courseId: "course-1", response },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "CONFLICT" });
	});

	it("rejects a learner without course access and does not create a row", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(false);

		await expect(
			call(
				submitOnboardingSurvey,
				{ courseId: "course-1", response },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(db.courseOnboardingSurveyResponse.create).not.toHaveBeenCalled();
	});
});
