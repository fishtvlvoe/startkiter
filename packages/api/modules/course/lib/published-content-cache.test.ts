import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: {
			findUnique: vi.fn(),
		},
		chapter: {
			findMany: vi.fn(),
		},
	},
}));

import { db } from "@startkiter/database";

import {
	getCachedPublishedLessonById,
	getCachedPublishedCurriculum,
	invalidatePublishedContentCache,
	PUBLISHED_CONTENT_CACHE_TTL_MS,
} from "./published-content-cache";

describe("published content server cache", () => {
	beforeEach(() => {
		vi.useRealTimers();
		invalidatePublishedContentCache();
		vi.clearAllMocks();
	});

	it("reuses a published lesson query within the TTL instead of hitting the database again", async () => {
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			id: "lesson-1",
			status: "PUBLISHED",
			content: "# lesson",
			chapter: { courseId: "course-1" },
		} as never);

		const first = await getCachedPublishedLessonById("lesson-1");
		const second = await getCachedPublishedLessonById("lesson-1");

		expect(first?.content).toBe("# lesson");
		expect(second?.content).toBe("# lesson");
		expect(db.lesson.findUnique).toHaveBeenCalledTimes(1);
	});

	it("reuses a published curriculum query within the TTL", async () => {
		vi.mocked(db.chapter.findMany).mockResolvedValue([
			{ id: "chapter-1", courseId: "course-1", lessons: [] },
		] as never);

		await getCachedPublishedCurriculum();
		await getCachedPublishedCurriculum();

		expect(db.chapter.findMany).toHaveBeenCalledTimes(1);
	});

	it("refetches published lesson content after the TTL expires", async () => {
		vi.useFakeTimers();
		vi.mocked(db.lesson.findUnique)
			.mockResolvedValueOnce({
				id: "lesson-1",
				status: "PUBLISHED",
				content: "# old",
				chapter: { courseId: "course-1" },
			} as never)
			.mockResolvedValueOnce({
				id: "lesson-1",
				status: "PUBLISHED",
				content: "# new",
				chapter: { courseId: "course-1" },
			} as never);

		const before = await getCachedPublishedLessonById("lesson-1");
		expect(before?.content).toBe("# old");

		vi.advanceTimersByTime(PUBLISHED_CONTENT_CACHE_TTL_MS + 1);

		const after = await getCachedPublishedLessonById("lesson-1");
		expect(after?.content).toBe("# new");
		expect(db.lesson.findUnique).toHaveBeenCalledTimes(2);
	});

	it("serves stale content until TTL expires, then serves the updated content after invalidation path", async () => {
		vi.useFakeTimers();
		vi.mocked(db.lesson.findUnique)
			.mockResolvedValueOnce({
				id: "lesson-1",
				status: "PUBLISHED",
				content: "# before-edit",
				chapter: { courseId: "course-1" },
			} as never)
			.mockResolvedValueOnce({
				id: "lesson-1",
				status: "PUBLISHED",
				content: "# after-edit",
				chapter: { courseId: "course-1" },
			} as never);

		expect((await getCachedPublishedLessonById("lesson-1"))?.content).toBe("# before-edit");

		// 模擬管理員已改 DB，但尚未主動失效、也未過 TTL → 仍見舊內容
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			id: "lesson-1",
			status: "PUBLISHED",
			content: "# after-edit",
			chapter: { courseId: "course-1" },
		} as never);
		expect((await getCachedPublishedLessonById("lesson-1"))?.content).toBe("# before-edit");

		vi.advanceTimersByTime(PUBLISHED_CONTENT_CACHE_TTL_MS + 1);
		expect((await getCachedPublishedLessonById("lesson-1"))?.content).toBe("# after-edit");
	});
});
