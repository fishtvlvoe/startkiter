import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: { findUnique: vi.fn() },
		lessonPrivateMessage: {
			create: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			updateMany: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/storage", () => ({
	getSignedUploadUrl: vi.fn(),
}));

vi.mock("../lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { getSignedUploadUrl } from "@startkiter/storage";

import { userCanAccessCourseId } from "../lib/course-access";
import { markLessonMessageRead, sendLessonMessage } from "./send-lesson-message";

const learnerSession = {
	session: { id: "session-1", userId: "learner-1" },
	user: { id: "learner-1", email: "learner@example.com", role: "user" },
};

describe("course lesson private messages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		process.env.S3_ENDPOINT = "https://storage.example";
		process.env.S3_ACCESS_KEY_ID = "test-access-key";
		process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
		vi.mocked(auth.api.getSession).mockResolvedValue(learnerSession as never);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			status: "PUBLISHED",
			isFreePreview: true,
			chapter: { courseId: "course-1" },
		} as never);
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);
		vi.mocked(db.lessonPrivateMessage.create).mockResolvedValue({
			id: "message-1",
			lessonId: "lesson-1",
			userId: "learner-1",
			content: "請問這段怎麼做？",
			isFromTeacher: false,
			readByTeacher: false,
		} as never);
		vi.mocked(getSignedUploadUrl).mockResolvedValue("https://storage.example/upload" as never);
	});

	it("allows a learner to send a lesson message", async () => {
		await expect(
			call(
				sendLessonMessage,
				{ lessonId: "lesson-1", content: "請問這段怎麼做？" },
				{ context: { headers: new Headers() } },
			),
		).resolves.toMatchObject({ id: "message-1", isFromTeacher: false });

		expect(db.lessonPrivateMessage.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ lessonId: "lesson-1", userId: "learner-1", content: "請問這段怎麼做？", isFromTeacher: false }),
		}));
	});

	it("allows an operator to reply on the learner's lesson thread", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "operator-1" },
			user: { id: "operator-1", email: "operator@example.com", role: "user" },
		} as never);
		vi.mocked(db.lessonPrivateMessage.findFirst).mockResolvedValue({ userId: "learner-1", lessonId: "lesson-1" } as never);
		vi.mocked(db.lessonPrivateMessage.create).mockResolvedValue({ id: "message-2", isFromTeacher: true } as never);

		await expect(
			call(
				sendLessonMessage,
				{ lessonId: "lesson-1", content: "我來幫你看。", isFromTeacher: true, threadUserId: "learner-1" },
				{ context: { headers: new Headers() } },
			),
		).resolves.toMatchObject({ id: "message-2", isFromTeacher: true });

		expect(db.lessonPrivateMessage.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ lessonId: "lesson-1", userId: "learner-1", isFromTeacher: true }),
		}));
	});

	it("marks a learner message as read without changing another thread", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "operator-1" },
			user: { id: "operator-1", email: "operator@example.com", role: "user" },
		} as never);
		vi.mocked(db.lessonPrivateMessage.updateMany).mockResolvedValue({ count: 1 } as never);

		await expect(
			call(markLessonMessageRead, { messageId: "message-1" }, { context: { headers: new Headers() } }),
		).resolves.toEqual({ read: true });

		expect(db.lessonPrivateMessage.updateMany).toHaveBeenCalledWith({
			where: { id: "message-1", isFromTeacher: false, readByTeacher: false },
			data: { readByTeacher: true },
		});
	});

	it("generates an opaque attachment key and returns a signed upload URL", async () => {
		await expect(
			call(
				sendLessonMessage,
				{
					lessonId: "lesson-1",
					content: "附上截圖",
					attachment: { filename: "../../原始檔名.png", mimeType: "image/png", size: 128 },
				},
				{ context: { headers: new Headers() } },
			),
		).resolves.toMatchObject({ signedUploadUrl: "https://storage.example/upload" });

		const createCall = vi.mocked(db.lessonPrivateMessage.create).mock.calls[0]?.[0];
		const attachmentStorageKey = (createCall?.data as { attachmentStorageKey?: string }).attachmentStorageKey;
		expect(attachmentStorageKey).toMatch(/^lesson-1\/[a-f0-9-]+\.png$/);
		expect(attachmentStorageKey).not.toContain("原始檔名");
		expect(getSignedUploadUrl).toHaveBeenCalledWith(attachmentStorageKey, expect.objectContaining({ bucket: "lessonMessages", contentType: "image/png", contentLength: 128 }));
	});
});
