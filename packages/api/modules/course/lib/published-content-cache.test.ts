import { beforeEach, describe, expect, it, vi } from "vitest";

const generationState = { value: 0 };

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: {
			findUnique: vi.fn(),
		},
		chapter: {
			findMany: vi.fn(),
		},
	},
	getPublishedContentCacheGeneration: () => generationState.value,
	bumpPublishedContentCacheGeneration: () => {
		generationState.value += 1;
		return generationState.value;
	},
}));

import { db } from "@startkiter/database";

import {
	getCachedPublishedLessonById,
	getCachedPublishedCurriculum,
	getPublishedLessonCacheSizeForTests,
	invalidatePublishedContentCache,
	PUBLISHED_CONTENT_CACHE_TTL_MS,
	PUBLISHED_LESSON_CACHE_MAX_ENTRIES,
} from "./published-content-cache";

describe("published content server cache", () => {
	beforeEach(() => {
		vi.useRealTimers();
		generationState.value = 0;
		invalidatePublishedContentCache();
		generationState.value = 0;
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

	it("refetches after generation bump from a content write (central invalidation)", async () => {
		vi.mocked(db.lesson.findUnique)
			.mockResolvedValueOnce({
				id: "lesson-1",
				status: "PUBLISHED",
				content: "# v1",
				chapter: { courseId: "course-1" },
			} as never)
			.mockResolvedValueOnce({
				id: "lesson-1",
				status: "PUBLISHED",
				content: "# v2",
				chapter: { courseId: "course-1" },
			} as never);

		expect((await getCachedPublishedLessonById("lesson-1"))?.content).toBe("# v1");

		// Prisma write extension bumps generation — no per-route invalidate required
		generationState.value += 1;

		expect((await getCachedPublishedLessonById("lesson-1"))?.content).toBe("# v2");
		expect(db.lesson.findUnique).toHaveBeenCalledTimes(2);
	});

	it("does not write stale DB results back after invalidate races the in-flight read", async () => {
		vi.mocked(db.lesson.findUnique).mockImplementation((async () => {
			// Invalidate while the DB read is in flight (generation moves forward).
			invalidatePublishedContentCache();
			return {
				id: "lesson-1",
				status: "PUBLISHED",
				content: "# stale-after-race",
				chapter: { courseId: "course-1" },
			} as never;
		}) as unknown as typeof db.lesson.findUnique);

		const raced = await getCachedPublishedLessonById("lesson-1");
		expect(raced?.content).toBe("# stale-after-race");
		expect(getPublishedLessonCacheSizeForTests()).toBe(0);

		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			id: "lesson-1",
			status: "PUBLISHED",
			content: "# fresh",
			chapter: { courseId: "course-1" },
		} as never);

		expect((await getCachedPublishedLessonById("lesson-1"))?.content).toBe("# fresh");
		expect(db.lesson.findUnique).toHaveBeenCalledTimes(2);
	});

	it("does not cache null / missing lessons", async () => {
		vi.mocked(db.lesson.findUnique).mockResolvedValue(null);

		await expect(getCachedPublishedLessonById("missing-1")).resolves.toBeNull();
		await expect(getCachedPublishedLessonById("missing-1")).resolves.toBeNull();

		expect(getPublishedLessonCacheSizeForTests()).toBe(0);
		expect(db.lesson.findUnique).toHaveBeenCalledTimes(2);
	});

	it("evicts the oldest lesson entries when the cache exceeds the max size", async () => {
		vi.mocked(db.lesson.findUnique).mockImplementation((async ({ where }: { where: { id?: unknown } }) => {
			const id = where.id as string;
			return {
				id,
				status: "PUBLISHED",
				content: `# ${id}`,
				chapter: { courseId: "course-1" },
			} as never;
		}) as unknown as typeof db.lesson.findUnique);

		for (let i = 0; i < PUBLISHED_LESSON_CACHE_MAX_ENTRIES + 3; i += 1) {
			await getCachedPublishedLessonById(`lesson-${i}`);
		}

		expect(getPublishedLessonCacheSizeForTests()).toBe(PUBLISHED_LESSON_CACHE_MAX_ENTRIES);

		// Oldest keys were evicted — fetching them hits the DB again.
		vi.mocked(db.lesson.findUnique).mockClear();
		await getCachedPublishedLessonById("lesson-0");
		expect(db.lesson.findUnique).toHaveBeenCalledTimes(1);
	});
});
