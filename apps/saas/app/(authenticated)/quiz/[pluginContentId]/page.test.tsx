import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(async () => ({ user: { id: "learner-1" } })),
}));

vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
}));

vi.mock("@startkiter/course-quiz", () => ({
	getQuizForLearner: vi.fn(async () => ({
		id: "quiz-1",
		title: "第一堂測驗",
		lessonId: "lesson-1",
		passingScore: 60,
		timeLimitMinutes: null,
		shuffleQuestions: false,
		shuffleOptions: false,
		blockNextLesson: false,
		questions: [],
		showAnswers: "NEVER",
	})),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: {
			findUnique: vi.fn(async () => ({
				status: "PUBLISHED",
				isFreePreview: true,
				chapter: { courseId: "course-1" },
			})),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(async () => true),
}));

import QuizPage from "./page";

describe("Quiz page uses an independent auto-mounted route", () => {
	it("renders the quiz route without a lesson block mount", async () => {
		const element = await QuizPage({ params: Promise.resolve({ pluginContentId: "quiz-1" }) });
		const html = renderToStaticMarkup(element);

		expect(html).toContain("第一堂測驗");
		expect(html).toContain("quiz-1");
	});
});
