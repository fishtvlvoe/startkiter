import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getSession: vi.fn(),
	canManageCourse: vi.fn(),
	uploadVideoToBunny: vi.fn(),
}));

vi.mock("@startkiter/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@startkiter/api/modules/course/lib/course-instructor-access", () => ({ canManageCourse: mocks.canManageCourse }));
vi.mock("@startkiter/platform", () => ({ uploadVideoToBunny: mocks.uploadVideoToBunny }));

import { POST } from "./route";

function request() {
	const body = new FormData();
	body.append("courseId", "course-1");
	body.append("file", new File(["video"], "lesson.mp4", { type: "video/mp4" }));
	return new Request("http://localhost/api/course/batch-import/upload-video", { method: "POST", body });
}

describe("POST /api/course/batch-import/upload-video", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getSession.mockResolvedValue({ user: { id: "user-1", email: "teacher@example.com" } });
		mocks.canManageCourse.mockResolvedValue(true);
		mocks.uploadVideoToBunny.mockResolvedValue({ bunnyVideoId: "video-1", duration: 12 });
	});

	it("rejects unauthenticated uploads before reading Bunny configuration", async () => {
		mocks.getSession.mockResolvedValue(null);

		const response = await POST(request());

		expect(response.status).toBe(401);
		expect(mocks.canManageCourse).not.toHaveBeenCalled();
		expect(mocks.uploadVideoToBunny).not.toHaveBeenCalled();
	});

	it("rejects a signed-in user without access to the course", async () => {
		mocks.canManageCourse.mockResolvedValue(false);

		const response = await POST(request());

		expect(response.status).toBe(403);
		expect(mocks.uploadVideoToBunny).not.toHaveBeenCalled();
	});
});
