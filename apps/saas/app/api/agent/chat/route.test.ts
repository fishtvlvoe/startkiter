import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/site-agent", () => ({
	runSiteAgentChat: vi.fn(),
}));

vi.mock("../data", () => ({
	createPrismaAgentDataAccess: vi.fn(() => ({})),
}));

import { auth } from "@startkiter/auth";
import { runSiteAgentChat } from "@startkiter/site-agent";

import { POST } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedRunSiteAgentChat = vi.mocked(runSiteAgentChat);

describe("POST /api/agent/chat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when there is no session", async () => {
		mockedGetSession.mockResolvedValue(null as never);

		const response = await POST(
			new Request("http://localhost/api/agent/chat", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message: "我的訂單？" }),
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "authentication_required" });
		expect(mockedRunSiteAgentChat).not.toHaveBeenCalled();
	});

	it("returns unauthenticated chat result when session is missing user", async () => {
		mockedGetSession.mockResolvedValue({ user: { id: "user_a" } } as never);
		mockedRunSiteAgentChat.mockResolvedValue({
			ok: true,
			assistantMessage: "收到：我的訂單？",
			toolTraces: [],
		});

		const response = await POST(
			new Request("http://localhost/api/agent/chat", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message: "我的訂單？" }),
			}),
		);

		expect(response.status).toBe(200);
		expect(mockedRunSiteAgentChat).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user_a",
				message: "我的訂單？",
			}),
		);
	});
});
