import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getSession: vi.fn(),
	canManageCourse: vi.fn(),
	chapterCreate: vi.fn(),
	lessonCreate: vi.fn(),
}));

vi.mock("@startkiter/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@startkiter/api/modules/course/lib/course-instructor-access", () => ({ canManageCourse: mocks.canManageCourse }));
vi.mock("@startkiter/api/modules/course/lib/course-operator", () => ({ isCourseOperator: vi.fn(() => false) }));
vi.mock("@startkiter/database", () => ({
	db: { chapter: { create: mocks.chapterCreate }, lesson: { create: mocks.lessonCreate } },
}));

import { POST } from "./route";

function request(body: unknown) {
	return new Request("http://localhost/api/course/batch-import/create-curriculum", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

const batch = {
	courseId: "course-1",
	chapters: [{ title: "Chapter 1", lessons: [{ title: "Lesson 1", content: "# Notes", bunnyVideoId: "video-1" }] }],
};

describe("POST /api/course/batch-import/create-curriculum", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	mocks.getSession.mockResolvedValue({ user: { id: "operator-1", email: "operator@example.com" } });
	 mocks.canManageCourse.mockResolvedValue(true);
		mocks.chapterCreate.mockResolvedValue({ id: "chapter-1" });
		mocks.lessonCreate.mockResolvedValue({ id: "lesson-1" });
		process.env.ADMIN_EMAIL = "operator@example.com";
	});

	it("creates matching chapter and lesson records only after confirmation", async () => {
		const response = await POST(request({ ...batch, confirmed: true }));

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ chaptersCreated: 1, lessonsCreated: 1, failures: [] });
		expect(mocks.chapterCreate).toHaveBeenCalledOnce();
		expect(mocks.lessonCreate).toHaveBeenCalledOnce();
	});

	it("does not write when confirmation is absent", async () => {
		const response = await POST(request(batch));

		expect(response.status).toBe(400);
		expect(mocks.chapterCreate).not.toHaveBeenCalled();
		expect(mocks.lessonCreate).not.toHaveBeenCalled();
	});

	it("keeps successful records and lists a failed lesson", async () => {
		mocks.lessonCreate.mockRejectedValueOnce(new Error("duplicate slug"));
		const response = await POST(request({
			...batch,
			confirmed: true,
			chapters: [{ title: "Chapter 1", lessons: [batch.chapters[0].lessons[0], { title: "Lesson 2", content: "", bunnyVideoId: "video-2" }] }],
		}));

		expect(response.status).toBe(207);
		expect(await response.json()).toMatchObject({ chaptersCreated: 1, lessonsCreated: 1, failures: [{ lessonTitle: "Lesson 1" }] });
	});

	it("generates a unique slug for every lesson", async () => {
		await POST(request({
			...batch,
			confirmed: true,
			chapters: [{ title: "Chapter 1", lessons: [{ ...batch.chapters[0].lessons[0], slug: "attacker-controlled-slug" }, { title: "Lesson 2" }] }],
		}));

		const firstSlug = mocks.lessonCreate.mock.calls[0]?.[0].data.slug;
		const secondSlug = mocks.lessonCreate.mock.calls[1]?.[0].data.slug;
		expect(firstSlug).toMatch(/^course-1-lesson-/);
		expect(secondSlug).toMatch(/^course-1-lesson-/);
		expect(firstSlug).not.toBe(secondSlug);
	});
});
