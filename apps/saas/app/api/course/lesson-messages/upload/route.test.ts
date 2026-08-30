import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/api/modules/course/procedures/lesson-message-upload", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/api/modules/course/procedures/lesson-message-upload")>();
	return {
		...actual,
		canAcceptLocalLessonMessageUpload: vi.fn(),
		recordLocalLessonMessageUpload: vi.fn(),
		verifyLocalLessonMessageUploadToken: vi.fn(),
	};
});

import {
	canAcceptLocalLessonMessageUpload,
	recordLocalLessonMessageUpload,
	verifyLocalLessonMessageUploadToken,
} from "@startkiter/api/modules/course/procedures/lesson-message-upload";

import { PUT } from "./route";

describe("PUT /api/course/lesson-messages/upload local fallback", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NODE_ENV", "test");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("is disabled in production even when a token is present", async () => {
		vi.stubEnv("NODE_ENV", "production");

		const response = await PUT(
			new Request("http://localhost/api/course/lesson-messages/upload?token=guessed", { method: "PUT" }),
		);

		expect(response.status).toBe(404);
		expect(verifyLocalLessonMessageUploadToken).not.toHaveBeenCalled();
	});

	it("returns 400 when the upload token is missing (no session gate; token is the credential)", async () => {
		const response = await PUT(new Request("http://localhost/api/course/lesson-messages/upload", { method: "PUT" }));

		expect(response.status).toBe(400);
		expect(verifyLocalLessonMessageUploadToken).not.toHaveBeenCalled();
		expect(recordLocalLessonMessageUpload).not.toHaveBeenCalled();
	});

	it("returns 403 for an invalid token (cannot upload into another lesson's object)", async () => {
		vi.mocked(verifyLocalLessonMessageUploadToken).mockReturnValue(null);

		const response = await PUT(
			new Request("http://localhost/api/course/lesson-messages/upload?token=forged-other-lesson", {
				method: "PUT",
			}),
		);

		expect(response.status).toBe(403);
		expect(canAcceptLocalLessonMessageUpload).not.toHaveBeenCalled();
		expect(recordLocalLessonMessageUpload).not.toHaveBeenCalled();
	});
});
