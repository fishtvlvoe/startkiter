import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("../../../../lib/github-kit", () => ({
	createPrismaGrantStore: vi.fn(),
	loadGithubKitRuntime: vi.fn(),
}));

import { auth } from "@startkiter/auth";

import { createPrismaGrantStore, loadGithubKitRuntime } from "../../../../lib/github-kit";
import { GET } from "./route";

const kitConfig = {
	appId: "1",
	installationId: "2",
	privateKeyPem: "-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
	org: "startkiter",
	repo: "shared-kit",
	templateRepo: "startkiter/kit-template",
};

describe("GET /api/github/claim-status", () => {
	const findLatestByUserId = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGithubKitRuntime).mockReturnValue({ config: kitConfig, oauthConfigured: true });
		vi.mocked(createPrismaGrantStore).mockReturnValue({
			findLatestByUserId,
			findActiveByUserId: vi.fn(),
			findByUserRepo: vi.fn(),
			upsertInvited: vi.fn(),
			markFailed: vi.fn(),
		} as never);
	});

	it("returns 401 when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

		const response = await GET(new Request("http://localhost/api/github/claim-status"));

		expect(response.status).toBe(401);
		expect(findLatestByUserId).not.toHaveBeenCalled();
	});

	it("loads claim status for the signed-in user id only", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-1" } } as never);
		findLatestByUserId.mockResolvedValue({
			status: "invited",
			githubLogin: "bob-dev",
			org: "startkiter",
			repo: "kit-ord_1",
		});

		const response = await GET(new Request("http://localhost/api/github/claim-status"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: "invited",
			githubLogin: "bob-dev",
			repo: "startkiter/kit-ord_1",
		});
		expect(findLatestByUserId).toHaveBeenCalledWith("user-1");
	});
});
