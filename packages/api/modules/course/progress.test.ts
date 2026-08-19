import { describe, expect, it, vi } from "vitest";

import { appendCompletedBlockId, calculateCourseProgress } from "./progress";

describe("calculateCourseProgress", () => {
	it("uses unique completed published lesson ids and rounds 3/8 to 38 percent", () => {
		expect(
			calculateCourseProgress({
				completedLessonIds: ["lesson-1", "lesson-1", "lesson-3", "archived-lesson"],
				publishedLessonIds: [
					"lesson-1",
					"lesson-2",
					"lesson-3",
					"lesson-4",
					"lesson-5",
					"lesson-6",
					"lesson-7",
					"lesson-8",
				],
			}),
		).toEqual({
			completedCount: 2,
			completedLessonIds: ["lesson-1", "lesson-3"],
			percentage: 25,
			totalCount: 8,
		});
	});

	it("returns the specified 3/8 display calculation", () => {
		expect(
			calculateCourseProgress({
				completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
				publishedLessonIds: [
					"lesson-1",
					"lesson-2",
					"lesson-3",
					"lesson-4",
					"lesson-5",
					"lesson-6",
					"lesson-7",
					"lesson-8",
				],
			}),
		).toMatchObject({ completedCount: 3, percentage: 38, totalCount: 8 });
	});

	it("atomically appends a new block instead of replacing concurrent block state", async () => {
		const writer = {
			create: vi.fn(),
			findUnique: vi.fn(),
			updateMany: vi.fn().mockResolvedValue({ count: 1 }),
		};

		await appendCompletedBlockId(writer, {
			blockId: "quiz-1",
			lessonId: "lesson-1",
			userId: "user-1",
		});

		expect(writer.updateMany).toHaveBeenCalledWith({
			data: { completedBlockIds: { push: "quiz-1" } },
			where: {
				NOT: { completedBlockIds: { has: "quiz-1" } },
				lessonId: "lesson-1",
				userId: "user-1",
			},
		});
		expect(writer.create).not.toHaveBeenCalled();
	});

	it("retries a simultaneous first-write collision as an atomic append", async () => {
		const writer = {
			create: vi.fn().mockRejectedValue({ code: "P2002" }),
			findUnique: vi.fn().mockResolvedValue(null),
			updateMany: vi.fn().mockResolvedValue({ count: 0 }),
		};

		await appendCompletedBlockId(writer, {
			blockId: "sorter-1",
			lessonId: "lesson-1",
			userId: "user-1",
		});

		expect(writer.create).toHaveBeenCalledWith({
			data: { completedBlockIds: ["sorter-1"], lessonId: "lesson-1", userId: "user-1" },
		});
		expect(writer.updateMany).toHaveBeenCalledTimes(2);
	});
});
