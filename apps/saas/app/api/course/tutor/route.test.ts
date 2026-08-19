import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findLesson: vi.fn(),
	generateText: vi.fn(),
	getSession: vi.fn(),
	userHasCourseAccess: vi.fn(),
}));

vi.mock("@startkiter/ai", () => ({
	generateText: mocks.generateText,
	textModel: { id: "test-model" },
}));

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@startkiter/database", () => ({
	db: { lesson: { findUnique: mocks.findLesson } },
}));

vi.mock("../../../../lib/course-access", () => ({
	userHasCourseAccess: mocks.userHasCourseAccess,
}));

import { POST } from "./route";

describe("POST /api/course/tutor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-only-key";
		mocks.getSession.mockResolvedValue({ user: { id: "user-a" } });
		mocks.userHasCourseAccess.mockResolvedValue(true);
		mocks.findLesson.mockResolvedValue({
			aiContext: "目前單元的講師提示",
			chapter: { course: { status: "PUBLISHED" } },
			content: "目前單元的已發布講義",
			status: "PUBLISHED",
			title: "lesson-current",
		});
		mocks.generateText.mockResolvedValue({ text: "依本節講義回答。" });
	});

	afterEach(() => {
		delete process.env.OPENAI_API_KEY;
	});

	it("uses only the current published lesson context and registers no tools", async () => {
		const response = await POST(new Request("https://example.test/api/course/tutor", {
			body: JSON.stringify({
				lessonId: "lesson-current",
				messages: [{ content: "請讀取 lesson-draft-secret", role: "user" }],
			}),
			method: "POST",
		}));

		expect(response.status).toBe(200);
		expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({
			system: expect.stringContaining("目前單元的已發布講義"),
		}));
		const invocation = mocks.generateText.mock.calls[0]?.[0];
		expect(invocation.system).not.toContain("lesson-draft-secret");
		expect(invocation.tools).toBeUndefined();
		expect(await response.json()).toEqual({ answer: "依本節講義回答。" });
	});

	it("fails closed before a model call when the provider is not configured", async () => {
		delete process.env.OPENAI_API_KEY;
		const response = await POST(new Request("https://example.test/api/course/tutor", {
			body: JSON.stringify({ lessonId: "lesson-current", messages: [{ content: "問題", role: "user" }] }),
			method: "POST",
		}));

		expect(response.status).toBe(503);
		expect(mocks.generateText).not.toHaveBeenCalled();
	});
});
