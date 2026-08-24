import { describe, expect, it } from "vitest";

import { calculateSubmissionRules, incrementRevisionNumber } from "./submission-rules";

describe("assignment submission rules", () => {
	it("marks a submission late after the due date", () => {
		expect(
			calculateSubmissionRules({
				submittedAt: new Date("2026-08-25T10:00:00Z"),
				dueAt: new Date("2026-08-25T09:00:00Z"),
				content: "這是一段足夠長的作業內容。",
				minWords: 1,
				maxWords: 100,
				fileCount: 0,
				maxFiles: 1,
			}),
		).toMatchObject({ isLate: true, contentError: null });
	});

	it("increments revision numbers without accepting zero or negative values", () => {
		expect(incrementRevisionNumber(1)).toBe(2);
		expect(incrementRevisionNumber(0)).toBe(1);
		expect(incrementRevisionNumber(-3)).toBe(1);
	});
});
