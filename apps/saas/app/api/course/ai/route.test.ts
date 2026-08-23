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
		lesson: { findUnique: vi.fn() },
		order: { findFirst: vi.fn(), findMany: vi.fn() },
		bundle: { findUnique: vi.fn() },
	},
}));

vi.mock("../../../../../../packages/ai", () => ({
	generateText: vi.fn(),
	textModel: {},
}));

vi.mock("@startkiter/api/modules/course/lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { db } from "@startkiter/database";
import { generateText } from "../../../../../../packages/ai";

import { POST } from "./route";

const authenticatedSession = {
	session: { id: "session-1", userId: "buyer-a" },
	user: { id: "buyer-a", email: "buyer-a@example.com", role: "user" },
};

const lesson = {
	id: "lesson-paid",
	status: "PUBLISHED",
	isFreePreview: false,
	title: "Paid lesson",
	content: "secret lesson content",
	aiContext: "lesson context",
	chapter: { courseId: "course-a" },
};

function request() {
	return new Request("http://localhost/api/course/ai", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ lessonId: "lesson-paid", question: "Explain this" }),
	});
}

describe("POST /api/course/ai bundle-aware access", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-key";
		vi.mocked(db.lesson.findUnique).mockResolvedValue(lesson as never);
		vi.mocked(auth.api.getSession).mockResolvedValue(authenticatedSession as never);
		vi.mocked(generateText).mockResolvedValue({ text: "answer" } as never);
	});

	it("allows an authenticated buyer to ask about a lesson in their bundle", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);

		const response = await POST(request());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ text: "answer" });
		expect(userCanAccessCourseId).toHaveBeenCalledWith("buyer-a", "course-a");
		expect(generateText).toHaveBeenCalledTimes(1);
	});

	it("returns 403 and does not send an outside-bundle lesson to the model", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(false);

		const response = await POST(request());

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({ error: "forbidden" });
		expect(generateText).not.toHaveBeenCalled();
	});

	it("returns 401 for an unauthenticated request", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		const response = await POST(request());

		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ error: "unauthorized" });
		expect(userCanAccessCourseId).not.toHaveBeenCalled();
	});

	it("allows an unauthenticated free-preview request without bundle lookup", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			...lesson,
			isFreePreview: true,
		} as never);

		const response = await POST(request());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ text: "answer" });
		expect(userCanAccessCourseId).not.toHaveBeenCalled();
		expect(generateText).toHaveBeenCalledTimes(1);
	});
});
