import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		pluginContent: { findMany: vi.fn(), findFirst: vi.fn() },
		quizAttempt: { findMany: vi.fn(), findUnique: vi.fn() },
		lesson: { findUnique: vi.fn() },
		user: { findUnique: vi.fn() },
		courseInstructor: { findUnique: vi.fn() },
	},
}));

vi.mock("../course/lib/course-instructor-access", () => ({
	requireCourseManageAccess: vi.fn(),
}));

import { db } from "@startkiter/database";
import { requireCourseManageAccess } from "../course/lib/course-instructor-access";

import { getQuizAttemptDetail, getQuizAttemptsForAdmin } from "./quiz-results";

const definition = {
	id: "quiz-1",
	pluginId: "quiz",
	type: "quiz-definition",
	title: "測驗",
	body: {
		lessonId: "lesson-1",
		passingScore: 60,
		timeLimitMinutes: null,
		shuffleQuestions: false,
		shuffleOptions: false,
		showAnswers: "IMMEDIATELY",
		blockNextLesson: false,
		questions: [{ id: "q1", type: "SINGLE_CHOICE", content: "1+1=?", options: [{ id: "a", text: "2" }, { id: "b", text: "3" }], correctAnswer: "a", explanation: null, points: 1 }],
	},
};

describe("quiz results for course managers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.pluginContent.findMany).mockResolvedValue([definition] as never);
		vi.mocked(db.pluginContent.findFirst).mockResolvedValue(definition as never);
		vi.mocked(db.quizAttempt.findMany).mockResolvedValue([
			{ id: "attempt-2", userId: "student-1", answers: { q1: "a" }, score: 100, passed: true, submittedAt: new Date("2026-09-02"), timeTakenSeconds: 10, user: { id: "student-1", name: "學員", email: "student@example.com" } },
			{ id: "attempt-1", userId: "student-1", answers: { q1: "b" }, score: 0, passed: false, submittedAt: new Date("2026-09-01"), timeTakenSeconds: 12, user: { id: "student-1", name: "學員", email: "student@example.com" } },
		] as never);
		vi.mocked(db.quizAttempt.findUnique).mockResolvedValue({ id: "attempt-2", userId: "student-1", pluginContentId: "quiz-1", answers: { q1: "a" }, score: 100, passed: true, submittedAt: new Date("2026-09-02"), user: { id: "student-1", name: "學員", email: "student@example.com" } } as never);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({ chapter: { courseId: "course-1" } } as never);
	});

	it("returns the latest attempt plus history count", async () => {
		await expect(getQuizAttemptsForAdmin("teacher-1", "course-1", "lesson-1")).resolves.toMatchObject([{ latestAttemptId: "attempt-2", score: 100, attemptCount: 2 }]);
		expect(requireCourseManageAccess).toHaveBeenCalledWith("teacher-1", "course-1");
	});

	it("returns per-question selected and correct answers", async () => {
		await expect(getQuizAttemptDetail("teacher-1", "course-1", "attempt-2")).resolves.toMatchObject({ questions: [{ selectedAnswer: "a", correctAnswer: "a", correct: true }] });
	});

	it("does not expose a quiz from another course", async () => {
		vi.mocked(db.lesson.findUnique).mockResolvedValue({ chapter: { courseId: "course-other" } } as never);

		await expect(getQuizAttemptsForAdmin("teacher-1", "course-1", "lesson-1")).rejects.toMatchObject({ code: "NOT_FOUND" });
		expect(db.quizAttempt.findMany).not.toHaveBeenCalled();
	});
});
