import { describe, expect, it, vi } from "vitest";

import { retryFailedLesson, type BatchLessonState } from "./batch-import-state";

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
