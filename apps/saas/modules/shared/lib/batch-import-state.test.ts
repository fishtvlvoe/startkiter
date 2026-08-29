import { describe, expect, it, vi } from "vitest";

import { formatImportFailures, retryFailedLesson, type BatchLessonState } from "./batch-import-state";

describe("retryFailedLesson", () => {
	it("reprocesses only the failed lesson and preserves completed state", async () => {
		const states: BatchLessonState[] = [
			{ id: "done", status: "completed" },
			{ id: "failed", status: "error", error: "UPLOAD_FAILED" },
		];
		const process = vi.fn().mockResolvedValue({ status: "completed" });

		const result = await retryFailedLesson(states, "failed", process);

		expect(process).toHaveBeenCalledOnce();
		expect(process).toHaveBeenCalledWith("failed");
		expect(result).toEqual([
			{ id: "done", status: "completed" },
			{ id: "failed", status: "completed" },
		]);
	});
});

describe("formatImportFailures", () => {
	it("summarizes partial import failures for the instructor", () => {
		expect(formatImportFailures([
			{ chapterTitle: "Chapter 1", lessonTitle: "Lesson 1", error: "DB_ERROR" },
			{ chapterTitle: "Chapter 2", lessonTitle: "Lesson 2", error: "DB_ERROR" },
		])).toBe("2 個單元建立失敗：Lesson 1、Lesson 2");
	});
});
