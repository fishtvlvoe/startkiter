import { call, ORPCError } from "@orpc/server";
import type { Session } from "@startkiter/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	VideoProvider: {
		BUNNY: "BUNNY",
		CUSTOM_MP4: "CUSTOM_MP4",
		HLS: "HLS",
		VIMEO: "VIMEO",
		YOUTUBE: "YOUTUBE",
	},
	db: {
		lesson: {
			findUnique: vi.fn(),
		},
		lessonProgress: {
			create: vi.fn(),
			delete: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { courseRouter } from "./router";

const authenticatedSession = {
	session: {
		activeOrganizationId: null,
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + 60_000),
		id: "session-1",
		impersonatedBy: null,
		ipAddress: null,
		token: "session-token",
		updatedAt: new Date(),
		userAgent: null,
		userId: "user-a",
	},
	user: {
		banExpires: null,
		banned: null,
		banReason: null,
		createdAt: new Date(),
		email: "user-a@example.com",
		emailVerified: true,
		id: "user-a",
		image: null,
		lastActiveOrganizationId: null,
		locale: null,
		name: "User A",
		onboardingComplete: true,
		role: "user",
		twoFactorEnabled: false,
		updatedAt: new Date(),
	},
} satisfies Session;

const lessonContent = [
	"# lesson-03",
	"",
	'<InstantQuiz blockId="quiz-01" question="Q" options={["A","B"]} answerIndex={1} explanation="E" />',
].join("\n");

function progressRow(id = "progress-1") {
	return {
		completedAt: new Date(),
		createdAt: new Date(),
		id,
		lessonId: "lesson-03",
		updatedAt: new Date(),
		userId: "user-a",
	};
}

describe("toggleLessonProgress block id verification", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(authenticatedSession);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			content: lessonContent,
			id: "lesson-03",
		} as never);
		vi.mocked(db.lessonProgress.create).mockResolvedValue(progressRow() as never);
	});

	it("writes progress for an allowlisted lesson block and returns the updated state", async () => {
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValue(null);

		const result = await call(
			courseRouter.toggleLessonProgress,
			{ blockId: "quiz-01", lessonId: "lesson-03" },
			{ context: { headers: new Headers() } },
		);

		expect(result).toEqual({ completed: true });
		expect(db.lessonProgress.create).toHaveBeenCalledWith({
			data: {
				lessonId: "lesson-03",
				userId: "user-a",
			},
		});
		expect(db.lessonProgress.delete).not.toHaveBeenCalled();
	});

	it("rejects a forged blockId and does not persist progress", async () => {
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValue(null);

		await expect(
			call(
				courseRouter.toggleLessonProgress,
				{ blockId: "forged-block", lessonId: "lesson-03" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});

		expect(db.lessonProgress.create).not.toHaveBeenCalled();
		expect(db.lessonProgress.delete).not.toHaveBeenCalled();
	});

	it("keeps a single progress row when the same user resubmits the same lesson block", async () => {
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValueOnce(null);
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValueOnce(progressRow() as never);

		const first = await call(
			courseRouter.toggleLessonProgress,
			{ blockId: "quiz-01", lessonId: "lesson-03" },
			{ context: { headers: new Headers() } },
		);
		const second = await call(
			courseRouter.toggleLessonProgress,
			{ blockId: "quiz-01", lessonId: "lesson-03" },
			{ context: { headers: new Headers() } },
		);

		expect(first).toEqual({ completed: true });
		expect(second).toEqual({ completed: true });
		expect(db.lessonProgress.create).toHaveBeenCalledTimes(1);
		expect(db.lessonProgress.delete).not.toHaveBeenCalled();
	});

	it("ignores a client userId and only writes the session user", async () => {
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValue(null);

		await call(
			courseRouter.toggleLessonProgress,
			{
				blockId: "quiz-01",
				lessonId: "lesson-03",
				userId: "user-b",
			} as never,
			{ context: { headers: new Headers() } },
		);

		expect(db.lessonProgress.create).toHaveBeenCalledWith({
			data: {
				lessonId: "lesson-03",
				userId: "user-a",
			},
		});
	});
});

describe("toggleLessonProgress input contract", () => {
	it("requires blockId", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(authenticatedSession);

		await expect(
			call(
				courseRouter.toggleLessonProgress,
				{ lessonId: "lesson-03" } as never,
				{ context: { headers: new Headers() } },
			),
		).rejects.toThrow(ORPCError);
	});
});

describe("toggleLessonProgress without interactive blocks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(authenticatedSession);
		vi.mocked(db.lessonProgress.create).mockResolvedValue(progressRow() as never);
	});

	it("marks a lesson with no interactive blocks complete without a blockId", async () => {
		// 純文字單元，沒有任何積木
		const plainTextContent = "# Pure Text Lesson\n\nThis is just text without any blocks.";
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			content: plainTextContent,
			id: "lesson-plain",
		} as never);
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValue(null);

		const result = await call(
			courseRouter.toggleLessonProgress,
			{ lessonId: "lesson-plain", blockId: undefined } as never,
			{ context: { headers: new Headers() } },
		);

		expect(result).toEqual({ completed: true });
		expect(db.lessonProgress.create).toHaveBeenCalledWith({
			data: {
				lessonId: "lesson-plain",
				userId: "user-a",
			},
		});
	});

	it("rejects a lesson with interactive blocks when no blockId is provided", async () => {
		// 有積木的單元，但不提供 blockId
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			content: lessonContent,
			id: "lesson-03",
		} as never);
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValue(null);

		await expect(
			call(
				courseRouter.toggleLessonProgress,
				{ lessonId: "lesson-03", blockId: undefined } as never,
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});

		expect(db.lessonProgress.create).not.toHaveBeenCalled();
	});

	it("still rejects a blockId that does not belong to the lesson", async () => {
		// 確保既有防偽造驗證仍然有效
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			content: lessonContent,
			id: "lesson-03",
		} as never);
		vi.mocked(db.lessonProgress.findUnique).mockResolvedValue(null);

		await expect(
			call(
				courseRouter.toggleLessonProgress,
				{ blockId: "forged-block", lessonId: "lesson-03" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
		});

		expect(db.lessonProgress.create).not.toHaveBeenCalled();
	});
});
