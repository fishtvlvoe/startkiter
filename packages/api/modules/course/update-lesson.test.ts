import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/course", () => ({
	inspectMdxSource: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	VideoProvider: {
		YOUTUBE: "YOUTUBE",
	},
	db: {
		lesson: {
			update: vi.fn(),
		},
	},
}));

vi.mock("./lib/video-resolver", () => ({
	resolveVideoSource: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { inspectMdxSource } from "@startkiter/course";
import { db } from "@startkiter/database";

import { COURSE_STUDIO_ERROR_CODES } from "./errors";
import { courseRouter } from "./router";

describe("course.updateLesson", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "operator-01", email: "operator@example.com", role: "user" },
			session: { id: "session-01", userId: "operator-01" },
		} as never);
		vi.mocked(inspectMdxSource).mockReturnValue({ ok: true });
		vi.mocked(db.lesson.update).mockResolvedValue({ id: "lesson-01" } as never);
	});

	it("拒絕無效 MDX 並回傳 400 contract，不寫入資料庫", async () => {
		const details = "講義內容含有未授權元件：EvilWidget";
		vi.mocked(inspectMdxSource).mockReturnValue({ ok: false, error: details });

		await expect(
			call(
				courseRouter.updateLesson,
				{ id: "lesson-01", content: "<EvilWidget />" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: details,
			data: { code: COURSE_STUDIO_ERROR_CODES.INVALID_MDX_CONTENT, details },
		});

		expect(db.lesson.update).not.toHaveBeenCalled();
	});

	it("allows role=admin even when email is not ADMIN_EMAIL", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-01", email: "other-admin@example.com", role: "admin" },
			session: { id: "session-02", userId: "admin-01" },
		} as never);

		await expect(
			call(
				courseRouter.updateLesson,
				{ id: "lesson-01", content: "# 合法內容" },
				{ context: { headers: new Headers() } },
			),
		).resolves.toMatchObject({ lesson: { id: "lesson-01" } });

		expect(inspectMdxSource).toHaveBeenCalled();
		expect(db.lesson.update).toHaveBeenCalled();
	});
});
