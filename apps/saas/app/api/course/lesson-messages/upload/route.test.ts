import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/api/modules/course/procedures/lesson-message-upload", () => ({
	canAcceptLocalLessonMessageUpload: vi.fn(),
	MAX_LOCAL_LESSON_MESSAGE_UPLOAD_TOKEN_LENGTH: 4096,
	recordLocalLessonMessageUpload: vi.fn(),
	verifyLocalLessonMessageUploadToken: vi.fn(),
}));

import { verifyLocalLessonMessageUploadToken } from "@startkiter/api/modules/course/procedures/lesson-message-upload";

import { PUT } from "./route";

describe("PUT /api/course/lesson-messages/upload local fallback", () => {
	const previousNodeEnv = process.env.NODE_ENV;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NODE_ENV = "test";
	});

	afterEach(() => {
		process.env.NODE_ENV = previousNodeEnv;
	});

	it("is disabled in production even when a token is present", async () => {
		process.env.NODE_ENV = "production";

		const response = await PUT(
			new Request("http://localhost/api/course/lesson-messages/upload?token=guessed", { method: "PUT" }),
		);

		expect(response.status).toBe(404);
		expect(verifyLocalLessonMessageUploadToken).not.toHaveBeenCalled();
	});

	it("rejects a request with no token so a guessed storage key cannot be written", async () => {
		const response = await PUT(
			new Request("http://localhost/api/course/lesson-messages/upload", { method: "PUT" }),
		);

		expect(response.status).toBe(400);
		expect(verifyLocalLessonMessageUploadToken).not.toHaveBeenCalled();
	});
});
