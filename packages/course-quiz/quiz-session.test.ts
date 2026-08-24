import { describe, expect, it } from "vitest";

import { createQuizStartToken, verifyQuizStartToken } from "./quiz-session";

const SECRET = "quiz-session-test-secret";

describe("quiz start tokens", () => {
	it("binds the server start time to the learner and quiz", () => {
		const now = new Date("2026-08-24T06:00:00.000Z");
		const token = createQuizStartToken({ userId: "user-1", pluginContentId: "quiz-1", now }, SECRET);

		expect(verifyQuizStartToken(token, SECRET)).toEqual({
			userId: "user-1",
			pluginContentId: "quiz-1",
			startedAt: now.toISOString(),
		});
	});

	it("rejects tampered tokens", () => {
		const token = createQuizStartToken({ userId: "user-1", pluginContentId: "quiz-1" }, SECRET);

		expect(verifyQuizStartToken(`${token}tampered`, SECRET)).toBeNull();
		expect(verifyQuizStartToken(token, "another-secret")).toBeNull();
	});
});
