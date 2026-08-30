import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/course", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/course")>();
	return {
		...actual,
		getLesson: vi.fn(),
		listLessons: vi.fn(),
	};
});

vi.mock("../../../../lib/course-access", () => ({
	userHasCourseAccess: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { getLesson, listLessons } from "@startkiter/course";

import { userHasCourseAccess } from "../../../../lib/course-access";
import { GET, POST } from "./route";

function jsonPost(body: unknown) {
	return new Request("http://localhost/api/course/lessons", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("GET/POST /api/course/lessons", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 for GET when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

		const response = await GET(new Request("http://localhost/api/course/lessons"));

		expect(response.status).toBe(401);
		expect(listLessons).not.toHaveBeenCalled();
		expect(userHasCourseAccess).not.toHaveBeenCalled();
	});

	it("returns 403 for GET when the signed-in user has not purchased the course", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user_1" } } as never);
		vi.mocked(userHasCourseAccess).mockResolvedValue(false);

		const response = await GET(new Request("http://localhost/api/course/lessons"));

		expect(response.status).toBe(403);
		expect(listLessons).not.toHaveBeenCalled();
	});

	it("returns 401 for POST when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
		vi.mocked(getLesson).mockReturnValue({ id: "lesson-1" } as never);

		const response = await POST(jsonPost({ lessonId: "lesson-1" }));

		expect(response.status).toBe(401);
	});

	it("returns 403 for POST when the signed-in user has not purchased the course", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user_1" } } as never);
		vi.mocked(userHasCourseAccess).mockResolvedValue(false);
		vi.mocked(getLesson).mockReturnValue({ id: "lesson-1" } as never);

		const response = await POST(jsonPost({ lessonId: "lesson-1" }));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "course_access_denied" });
	});
});
