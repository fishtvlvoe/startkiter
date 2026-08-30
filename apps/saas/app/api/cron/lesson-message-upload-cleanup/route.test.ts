import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/api/modules/course/procedures/lesson-message-upload-cleanup", () => ({
	cleanupExpiredLessonMessageUploadIntents: vi.fn(),
}));

import { cleanupExpiredLessonMessageUploadIntents } from "@startkiter/api/modules/course/procedures/lesson-message-upload-cleanup";

import { POST } from "./route";

describe("POST /api/cron/lesson-message-upload-cleanup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("LESSON_MESSAGE_UPLOAD_CLEANUP_SECRET", "cleanup-secret");
		vi.mocked(cleanupExpiredLessonMessageUploadIntents).mockResolvedValue({ scanned: 1, deleted: 1 });
	});

	it.each([undefined, "Bearer wrong", "Basic cleanup-secret"])(
		"rejects an invalid authorization header: %s",
		async (authorization) => {
			const response = await POST(
				new Request("http://localhost/api/cron/lesson-message-upload-cleanup", {
					headers: authorization ? { authorization } : undefined,
				}),
			);

			expect(response.status).toBe(401);
			expect(cleanupExpiredLessonMessageUploadIntents).not.toHaveBeenCalled();
		},
	);
});
