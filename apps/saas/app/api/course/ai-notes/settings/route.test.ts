import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/gemini-settings", () => ({
	readGeminiApiKey: vi.fn(),
}));

import { readGeminiApiKey } from "@startkiter/api/modules/course/lib/gemini-settings";
import { auth } from "@startkiter/auth";

import { GET } from "./route";

describe("GET /api/course/ai-notes/settings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

		const response = await GET(new Request("http://localhost/api/course/ai-notes/settings"));

		expect(response.status).toBe(401);
		expect(readGeminiApiKey).not.toHaveBeenCalled();
	});

	it("looks up the Gemini key for the signed-in user id only", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "instructor-1", email: "instructor@example.com" },
		} as never);
		vi.mocked(readGeminiApiKey).mockResolvedValue("AIza-test");

		const response = await GET(new Request("http://localhost/api/course/ai-notes/settings"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ configured: true });
		expect(readGeminiApiKey).toHaveBeenCalledWith("instructor-1");
	});
});
