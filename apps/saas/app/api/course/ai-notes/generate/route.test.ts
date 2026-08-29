import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: { lesson: { findUnique: vi.fn() } },
}));

vi.mock("@startkiter/api/modules/course/lib/course-instructor-access", () => ({
	canManageCourse: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/gemini-settings", () => ({
	readGeminiApiKey: vi.fn(),
}));

vi.mock("@startkiter/platform", () => ({
	checkRateLimit: vi.fn(),
	srtToText: vi.fn((value: string) => value),
}));

vi.mock("ai", () => ({
	streamText: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { canManageCourse } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { readGeminiApiKey } from "@startkiter/api/modules/course/lib/gemini-settings";
import { db } from "@startkiter/database";
import { checkRateLimit } from "@startkiter/platform";
import { POST } from "./route";

const session = {
	session: { id: "session-1", userId: "instructor-1" },
	user: { id: "instructor-1", email: "instructor@example.com", role: "user" },
};

const lesson = {
	id: "lesson-1",
	title: "Lesson title",
	chapter: { courseId: "course-1", title: "Chapter title" },
};

function request() {
	return new Request("http://localhost/api/course/ai-notes/generate", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			lessonId: "lesson-1",
			chapterTitle: "Chapter title",
			lessonTitle: "Lesson title",
			srtContent: "1\n00:00:00,000 --> 00:00:01,000\nSubtitle",
		}),
	});
}

describe("POST /api/course/ai-notes/generate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(session as never);
		vi.mocked(db.lesson.findUnique).mockResolvedValue(lesson as never);
		vi.mocked(canManageCourse).mockResolvedValue(true);
		vi.mocked(readGeminiApiKey).mockResolvedValue("AIza-test-key");
		vi.mocked(checkRateLimit).mockReturnValue({ allowed: true });
	});

	it("returns GEMINI_KEY_MISSING without calling the provider when no key is configured", async () => {
		vi.mocked(readGeminiApiKey).mockResolvedValue(null);

		const response = await POST(request());

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ error: "GEMINI_KEY_MISSING" });
	});

	it("returns 403 for a non-manager without consuming rate-limit quota", async () => {
		vi.mocked(canManageCourse).mockResolvedValue(false);

		const response = await POST(request());

		expect(response.status).toBe(403);
		expect(checkRateLimit).not.toHaveBeenCalled();
		 expect(readGeminiApiKey).not.toHaveBeenCalled();
	});

	it("returns 429 with retryAfterMs without calling the provider when rate limited", async () => {
		vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfterMs: 12_345 });

		const response = await POST(request());

		expect(response.status).toBe(429);
		expect(await response.json()).toMatchObject({ error: "RATE_LIMITED", retryAfterMs: 12_345 });
	});
});
