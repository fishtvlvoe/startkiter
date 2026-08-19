import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findLessons: vi.fn(),
	findProgressRecord: vi.fn(),
	findProgress: vi.fn(),
	findUniqueLesson: vi.fn(),
	getSession: vi.fn(),
	parseCourseMdx: vi.fn(),
	createProgress: vi.fn(),
	updateManyProgress: vi.fn(),
	upsertProgress: vi.fn(),
	userHasCourseAccess: vi.fn(),
}));

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: { findMany: mocks.findLessons, findUnique: mocks.findUniqueLesson },
		lessonProgress: {
			findMany: mocks.findProgress,
			findUnique: mocks.findProgressRecord,
			create: mocks.createProgress,
			updateMany: mocks.updateManyProgress,
			upsert: mocks.upsertProgress,
		},
	},
}));

vi.mock("@startkiter/course/src/mdx/course-mdx", () => ({
	parseCourseMdx: mocks.parseCourseMdx,
}));

vi.mock("../../../../lib/course-access", () => ({
	userHasCourseAccess: mocks.userHasCourseAccess,
}));

import { POST } from "./route";

describe("POST /api/course/progress", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSession.mockResolvedValue({ user: { id: "user-a" } });
		mocks.userHasCourseAccess.mockResolvedValue(true);
		mocks.findUniqueLesson.mockResolvedValue({
			chapter: { courseId: "course-1", course: { status: "PUBLISHED" } },
			content: '<InstantQuiz id="quiz-1" question="Q" options=\'["A"]\' answerIndex="0" explanation="E" />',
			id: "lesson-1",
			status: "PUBLISHED",
		});
		mocks.findLessons.mockResolvedValue([{ id: "lesson-1" }, { id: "lesson-2" }]);
		mocks.findProgress.mockResolvedValue([{ lessonId: "lesson-1" }]);
		mocks.findProgressRecord.mockResolvedValue(null);
		mocks.updateManyProgress.mockResolvedValue({ count: 1 });
		mocks.upsertProgress.mockResolvedValue({});
		mocks.parseCourseMdx.mockReturnValue({ blocks: [{ id: "quiz-1" }], markdown: "", ok: true });
	});

	it("derives the learner identity from the session and persists a lesson completion", async () => {
		const response = await POST(new Request("https://example.test/api/course/progress", {
			body: JSON.stringify({ lessonId: "lesson-1", type: "lesson" }),
			headers: { "content-type": "application/json" },
			method: "POST",
		}));

		expect(response.status).toBe(200);
		expect(mocks.upsertProgress).toHaveBeenCalledWith(expect.objectContaining({
			create: expect.objectContaining({ lessonId: "lesson-1", userId: "user-a" }),
		}));
		expect(await response.json()).toMatchObject({
			progress: { completedCount: 1, percentage: 50, totalCount: 2 },
		});
	});

	it("rejects a forged user id and a block id that is not in this lesson", async () => {
		const forgedActor = await POST(new Request("https://example.test/api/course/progress", {
			body: JSON.stringify({ lessonId: "lesson-1", type: "lesson", userId: "user-b" }),
			method: "POST",
		}));
		expect(forgedActor.status).toBe(400);

		mocks.parseCourseMdx.mockReturnValue({ blocks: [{ id: "quiz-1" }], markdown: "", ok: true });
		const forgedBlock = await POST(new Request("https://example.test/api/course/progress", {
			body: JSON.stringify({ blockId: "other-lesson-block", lessonId: "lesson-1", type: "block" }),
			method: "POST",
		}));
		expect(forgedBlock.status).toBe(400);
		expect(mocks.upsertProgress).not.toHaveBeenCalled();
	});

	it("appends an approved interactive block through the session-owned progress record", async () => {
		const response = await POST(new Request("https://example.test/api/course/progress", {
			body: JSON.stringify({ blockId: "quiz-1", lessonId: "lesson-1", type: "block" }),
			method: "POST",
		}));

		expect(response.status).toBe(200);
		expect(mocks.updateManyProgress).toHaveBeenCalledWith(expect.objectContaining({
			where: expect.objectContaining({ lessonId: "lesson-1", userId: "user-a" }),
		}));
	});
});
