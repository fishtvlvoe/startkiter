import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/github-kit", () => ({
	createGithubVersionFileReader: vi.fn(),
	getRepoVersion: vi.fn(),
}));

vi.mock("../../../lib/github-kit", () => ({
	createPrismaGrantStore: vi.fn(() => ({})),
	loadGithubKitRuntime: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { getRepoVersion } from "@startkiter/github-kit";

import { loadGithubKitRuntime } from "../../../lib/github-kit";
import { GET } from "./route";

describe("GET /api/repo-version", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGithubKitRuntime).mockReturnValue({ config: null, oauthConfigured: false });
	});

	it("returns 401 when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
		vi.mocked(getRepoVersion).mockResolvedValue({
			ok: false,
			httpStatus: 401,
			error: "authentication_required",
		});

		const response = await GET(new Request("http://localhost/api/repo-version"));

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "authentication_required" });
		expect(getRepoVersion).toHaveBeenCalledWith(expect.objectContaining({ userId: undefined }));
	});

	it("returns buyer/latest version fields for the signed-in user", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-1" } } as never);
		vi.mocked(getRepoVersion).mockResolvedValue({
			ok: true,
			body: {
				buyerVersion: "1.0.0",
				latestVersion: "1.1.0",
				upToDate: false,
				syncPromptHint: "git fetch startkiter-upstream",
			},
		});

		const response = await GET(new Request("http://localhost/api/repo-version"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			buyerVersion: "1.0.0",
			latestVersion: "1.1.0",
			upToDate: false,
			syncPromptHint: "git fetch startkiter-upstream",
		});
		expect(getRepoVersion).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
	});
});
