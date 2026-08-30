import { call } from "@orpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: { findUnique: vi.fn() },
		lessonMessageUploadIntent: { create: vi.fn() },
	},
}));

vi.mock("@startkiter/storage", () => ({
	getSignedUploadUrl: vi.fn(),
	getSignedUrl: vi.fn(),
}));

vi.mock("../lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

vi.mock("./lesson-message-upload-cleanup", () => ({
	cleanupExpiredLessonMessageUploadIntents: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { getSignedUploadUrl } from "@startkiter/storage";

import { userCanAccessCourseId } from "../lib/course-access";
import { prepareLessonMessageAttachment } from "./send-lesson-message";
import {
	buildLessonMessageStorageKey,
	getLessonMessageSignedUploadUrl,
	verifyLessonMessageUploadToken,
	createLessonMessageUploadToken,
} from "./lesson-message-upload";

const learnerSession = {
	session: { id: "session-1", userId: "learner-1" },
	user: { id: "learner-1", email: "learner@example.com", role: "user" },
};

describe("lesson message upload keys", () => {
	it("prefixes the object key with the lesson id and drops the caller filename", () => {
		const key = buildLessonMessageStorageKey("lesson-9", "../../secret.png");

		expect(key).toMatch(/^lesson-9\/[a-f0-9-]+\.png$/);
		expect(key).not.toContain("secret");
		expect(key).not.toContain("..");
	});
});

describe("prepareLessonMessageAttachment ownership", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		process.env.S3_ENDPOINT = "https://storage.example";
		process.env.S3_ACCESS_KEY_ID = "test-access-key";
		process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
		vi.mocked(auth.api.getSession).mockResolvedValue(learnerSession as never);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			status: "PUBLISHED",
			isFreePreview: false,
			chapter: { courseId: "course-1" },
		} as never);
		vi.mocked(db.lessonMessageUploadIntent.create).mockResolvedValue({ id: "intent-1" } as never);
		vi.mocked(getSignedUploadUrl).mockResolvedValue("https://storage.example/lesson-upload");
	});

	it("refuses a signed upload URL when the caller cannot access the lesson course", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(false);

		await expect(
			call(
				prepareLessonMessageAttachment,
				{ lessonId: "lesson-1", attachment: { filename: "shot.png", mimeType: "image/png", size: 128 } },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(getSignedUploadUrl).not.toHaveBeenCalled();
		expect(db.lessonMessageUploadIntent.create).not.toHaveBeenCalled();
	});

	it("issues a key under the requested lesson for a participant", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);

		const result = await call(
			prepareLessonMessageAttachment,
			{ lessonId: "lesson-1", attachment: { filename: "shot.png", mimeType: "image/png", size: 128 } },
			{ context: { headers: new Headers() } },
		);

		expect(result.signedUploadUrl).toBe("https://storage.example/lesson-upload");
		const storageKey = vi.mocked(getSignedUploadUrl).mock.calls[0]?.[0];
		expect(storageKey).toMatch(/^lesson-1\/[a-f0-9-]+\.png$/);
	});
});

describe("lesson message upload tokens", () => {
	const previousSecret = process.env.BETTER_AUTH_SECRET;

	afterEach(() => {
		process.env.BETTER_AUTH_SECRET = previousSecret;
	});

	it("rejects an expired finalize token", () => {
		process.env.BETTER_AUTH_SECRET = "test-lesson-message-secret";
		const token = createLessonMessageUploadToken({
			intentId: "intent-1",
			lessonId: "lesson-1",
			userId: "learner-1",
			storageKey: "lesson-1/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png",
			contentType: "image/png",
			size: 128,
			expiresAt: Date.now() - 1,
		});

		expect(verifyLessonMessageUploadToken(token)).toBeNull();
	});
});

describe("getLessonMessageSignedUploadUrl local fallback", () => {
	const previousEnv = {
		NODE_ENV: process.env.NODE_ENV,
		S3_ENDPOINT: process.env.S3_ENDPOINT,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
	};

	afterEach(() => {
		process.env.NODE_ENV = previousEnv.NODE_ENV;
		process.env.S3_ENDPOINT = previousEnv.S3_ENDPOINT;
		process.env.S3_ACCESS_KEY_ID = previousEnv.S3_ACCESS_KEY_ID;
		process.env.S3_SECRET_ACCESS_KEY = previousEnv.S3_SECRET_ACCESS_KEY;
	});

	it("refuses the local upload adapter in production when S3 is not configured", async () => {
		process.env.NODE_ENV = "production";
		delete process.env.S3_ENDPOINT;
		delete process.env.S3_ACCESS_KEY_ID;
		delete process.env.S3_SECRET_ACCESS_KEY;

		await expect(
			getLessonMessageSignedUploadUrl({
				storageKey: "lesson-1/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png",
				contentType: "image/png",
				size: 128,
				maxSize: 10_000_000,
			}),
		).rejects.toThrow("Lesson message storage is not configured");
	});
});
