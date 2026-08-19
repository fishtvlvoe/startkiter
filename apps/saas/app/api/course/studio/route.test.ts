import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	executeStudioCommand: vi.fn(),
	getSession: vi.fn(),
	getStudioSnapshot: vi.fn(),
	safeParse: vi.fn(),
}));

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: mocks.getSession,
		},
	},
}));

vi.mock("@startkiter/api/modules/course/studio-service", () => ({
	CourseStudioError: class CourseStudioError extends Error {
		status = 400;
	},
	executeStudioCommand: mocks.executeStudioCommand,
	getStudioSnapshot: mocks.getStudioSnapshot,
	studioCommandSchema: { safeParse: mocks.safeParse },
}));

import { GET, POST } from "./route";

describe("GET /api/course/studio", () => {
	beforeEach(() => {
		mocks.getSession.mockReset();
		mocks.getStudioSnapshot.mockReset();
		mocks.executeStudioCommand.mockReset();
		mocks.safeParse.mockReset();
	});

	it("rejects a non-operator mutation before parsing or touching Studio data", async () => {
		mocks.getSession.mockResolvedValue({
			user: { email: "learner@example.test", id: "learner-1", role: "user" },
		});

		expect(
			(await POST(new Request("https://example.test/api/course/studio", {
				body: JSON.stringify({ action: "createCourse", title: "不可建立" }),
				method: "POST",
			}))).status,
		).toBe(403);
		expect(mocks.safeParse).not.toHaveBeenCalled();
		expect(mocks.executeStudioCommand).not.toHaveBeenCalled();
	});

	it("persists an operator command through the server command handler", async () => {
		mocks.getSession.mockResolvedValue({
			user: { email: "operator@example.test", id: "operator-1", role: "operator" },
		});
		mocks.safeParse.mockReturnValue({
			data: { action: "createCourse", title: "電馭學院" },
			success: true,
		});
		mocks.executeStudioCommand.mockResolvedValue({ id: "course-1" });

		const response = await POST(new Request("https://example.test/api/course/studio", {
			body: JSON.stringify({ action: "createCourse", title: "電馭學院" }),
			method: "POST",
		}));

		expect(response.status).toBe(200);
		expect(mocks.executeStudioCommand).toHaveBeenCalledWith(
			{ action: "createCourse", title: "電馭學院" },
			"operator-1",
		);
	});

	it("returns 401 without a session", async () => {
		mocks.getSession.mockResolvedValue(null);

		expect((await GET(new Request("https://example.test/api/course/studio"))).status).toBe(401);
	});

	it("returns 403 for an authenticated non-operator", async () => {
		mocks.getSession.mockResolvedValue({
			user: { email: "learner@example.test", id: "learner-1", role: "user" },
		});

		expect((await GET(new Request("https://example.test/api/course/studio"))).status).toBe(403);
		expect(mocks.getStudioSnapshot).not.toHaveBeenCalled();
	});

	it("returns persisted studio data only for an operator", async () => {
		mocks.getSession.mockResolvedValue({
			user: { email: "operator@example.test", id: "operator-1", role: "operator" },
		});
		mocks.getStudioSnapshot.mockResolvedValue({ courses: [], folders: [] });

		const response = await GET(new Request("https://example.test/api/course/studio"));

		expect(response.status).toBe(200);
		expect(mocks.getStudioSnapshot).toHaveBeenCalledWith("operator-1");
	});
});
