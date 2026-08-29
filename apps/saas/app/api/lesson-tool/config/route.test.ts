import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		courseInstructor: {
			findUnique: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { PATCH } from "./route";

const lesson = {
	id: "lesson-1",
	toolUrl: null,
	toolTitle: null,
	chapter: { courseId: "course-1" },
};

const instructorSession = {
	session: { id: "session-1", userId: "instructor-1" },
	user: { id: "instructor-1", email: "instructor@example.com" },
};

function configRequest(body: Record<string, unknown>) {
	return new Request("http://localhost/api/lesson-tool/config", {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("PATCH /api/lesson-tool/config (Requirement: Instructor can configure an embedded tool for a lesson)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue(instructorSession as never);
		vi.mocked(db.lesson.findUnique).mockResolvedValue(lesson as never);
		vi.mocked(db.lesson.update).mockResolvedValue({
			...lesson,
			toolUrl: "https://tools.example.com/whiteboard",
			toolTitle: "白板",
		} as never);
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue({ id: "assignment-1" } as never);
	});

	it("lets an instructor with course management permission persist a public tool URL", async () => {
		const response = await PATCH(
			configRequest({
				lessonId: "lesson-1",
				toolUrl: "https://tools.example.com/whiteboard",
				toolTitle: "白板",
			}),
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			toolUrl: "https://tools.example.com/whiteboard",
			toolTitle: "白板",
		});
		expect(db.lesson.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "lesson-1" },
				data: {
					toolUrl: "https://tools.example.com/whiteboard",
					toolTitle: "白板",
				},
			}),
		);
	});

	it("returns 403 for a non-manager and does not write Lesson.toolUrl", async () => {
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);

		const response = await PATCH(
			configRequest({
				lessonId: "lesson-1",
				toolUrl: "https://tools.example.com/whiteboard",
				toolTitle: "白板",
			}),
		);

		expect(response.status).toBe(403);
		expect(db.lesson.update).not.toHaveBeenCalled();
	});

	it("returns 400 TOOL_URL_PRIVATE for a private-range URL and does not persist it", async () => {
		const response = await PATCH(
			configRequest({
				lessonId: "lesson-1",
				toolUrl: "http://127.0.0.1/admin",
				toolTitle: "內網",
			}),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({ error: "TOOL_URL_PRIVATE" });
		expect(db.lesson.update).not.toHaveBeenCalled();
	});
});
