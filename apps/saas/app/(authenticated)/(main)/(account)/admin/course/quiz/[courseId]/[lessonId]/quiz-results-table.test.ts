import { describe, expect, it } from "vitest";

import { buildQuizResultsCsv } from "./quiz-results-table";

describe("quiz results CSV export", () => {
	it("contains the required headers and escaped learner values", () => {
		const csv = buildQuizResultsCsv([{
			userId: "user-1",
			userName: '學員, "一"',
			userEmail: "student@example.com",
			attemptCount: 2,
			latestAttemptId: "attempt-2",
			score: 80,
			passed: true,
			submittedAt: "2026-09-23T10:00:00.000Z",
			timeTakenSeconds: 42,
		}]);

		expect(csv).toContain("\ufeff\"學員姓名\",\"學員 Email\",\"分數\",\"作答時間\",\"及格與否\"");
		expect(csv).toContain('"學員, ""一""","student@example.com","80","2026-09-23T10:00:00.000Z","是"');
	});
});
