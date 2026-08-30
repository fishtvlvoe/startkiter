import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: { findUnique: vi.fn() },
		assignmentUploadIntent: { findMany: vi.fn() },
		$transaction: vi.fn(),
	},
}));

vi.mock("@startkiter/course-assignment", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/course-assignment")>();
	return {
		...actual,
		getAssignmentDefinition: vi.fn(),
	};
});

vi.mock("../course/lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

vi.mock("./assignment-upload", async (importOriginal) => {
	const actual = await importOriginal<typeof import("./assignment-upload")>();
	return {
		...actual,
		getAssignmentSignedUploadUrl: vi.fn(),
		isAssignmentStorageConfigured: vi.fn(() => true),
	};
});

import { auth } from "@startkiter/auth";
import { getAssignmentDefinition } from "@startkiter/course-assignment";
import { db } from "@startkiter/database";

import { userCanAccessCourseId } from "../course/lib/course-access";
import { getAssignmentSignedUploadUrl } from "./assignment-upload";
import { assignmentRouter } from "./router";

const learnerSession = {
	session: { id: "session-1", userId: "learner-1" },
	user: { id: "learner-1", email: "learner@example.com", role: "user" },
};

const definition = {
	id: "assignment-1",
	title: "作業一",
	body: {
		lessonId: "lesson-1",
		allowedExtensions: ["pdf"],
		maxFileSize: 1_000_000,
		maxFiles: 2,
	},
};

describe("assignmentRouter.createUploadUrl ownership", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(learnerSession as never);
		vi.mocked(getAssignmentDefinition).mockResolvedValue(definition as never);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			status: "PUBLISHED",
			isFreePreview: false,
			chapter: { courseId: "course-1" },
		} as never);
		vi.mocked(db.assignmentUploadIntent.findMany).mockResolvedValue([] as never);
		vi.mocked(getAssignmentSignedUploadUrl).mockResolvedValue({
			signedUploadUrl: "https://storage.example/assignment-upload",
			localDevelopment: false,
		});
		vi.mocked(db.$transaction).mockImplementation(async (callback: (tx: typeof db) => unknown) => {
			const tx = {
				$executeRaw: vi.fn(),
				assignmentUploadIntent: {
					count: vi.fn().mockResolvedValue(0),
					create: vi.fn(),
				},
				assignmentSubmission: {
					findFirst: vi.fn().mockResolvedValue({ id: "submission-learner-1" }),
				},
			};
			return callback(tx as never);
		});
	});

	it("rejects a caller who cannot access the assignment's course", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(false);

		await expect(
			call(
				assignmentRouter.createUploadUrl,
				{ pluginContentId: "assignment-1", filename: "hw.pdf", mimeType: "application/pdf", size: 128 },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(getAssignmentSignedUploadUrl).not.toHaveBeenCalled();
		expect(db.$transaction).not.toHaveBeenCalled();
	});

	it("scopes the storage key to the caller's draft submission", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);

		const result = await call(
			assignmentRouter.createUploadUrl,
			{ pluginContentId: "assignment-1", filename: "hw.pdf", mimeType: "application/pdf", size: 128 },
			{ context: { headers: new Headers() } },
		);

		expect(result.storageKey).toMatch(/^submission-learner-1\/[a-f0-9-]+\.pdf$/);
		expect(result.signedUploadUrl).toBe("https://storage.example/assignment-upload");
		expect(getAssignmentSignedUploadUrl).toHaveBeenCalledWith(
			expect.objectContaining({
				storageKey: result.storageKey,
				contentType: "application/pdf",
				size: 128,
			}),
		);
	});
});
