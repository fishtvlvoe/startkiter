import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/api/modules/assignment/assignment-lifecycle", () => ({
	cleanupExpiredAssignmentUploadIntents: vi.fn(),
}));

import { cleanupExpiredAssignmentUploadIntents } from "@startkiter/api/modules/assignment/assignment-lifecycle";

import { POST } from "./route";

describe("POST /api/cron/assignment-upload-cleanup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("ASSIGNMENT_UPLOAD_CLEANUP_SECRET", "cleanup-secret");
		vi.mocked(cleanupExpiredAssignmentUploadIntents).mockResolvedValue({ inspected: 1, removed: 1, failed: 0 });
	});

	it.each([undefined, "Bearer wrong", "Basic cleanup-secret"])(
		"rejects an invalid authorization header: %s",
		async (authorization) => {
			const response = await POST(
				new Request("http://localhost/api/cron/assignment-upload-cleanup", {
					headers: authorization ? { authorization } : undefined,
				}),
			);

			expect(response.status).toBe(401);
			expect(cleanupExpiredAssignmentUploadIntents).not.toHaveBeenCalled();
		},
	);
});
