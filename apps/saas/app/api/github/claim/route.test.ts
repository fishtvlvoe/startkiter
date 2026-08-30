import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("../../../../lib/github-kit", () => ({
	createConfiguredCollaboratorClient: vi.fn(),
	createPrismaEligibilityReader: vi.fn(),
	createPrismaGithubIdentityReaderWithUserApi: vi.fn(),
	createPrismaGrantStore: vi.fn(),
	loadGithubKitRuntime: vi.fn(),
}));

import { auth } from "@startkiter/auth";

import {
	createConfiguredCollaboratorClient,
	createPrismaEligibilityReader,
	createPrismaGithubIdentityReaderWithUserApi,
	createPrismaGrantStore,
	loadGithubKitRuntime,
} from "../../../../lib/github-kit";
import { POST } from "./route";

const kitConfig = {
	appId: "1",
	installationId: "2",
	privateKeyPem: "-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
	org: "startkiter",
	repo: "shared-kit",
	templateRepo: "startkiter/kit-template",
};

describe("POST /api/github/claim", () => {
	const generateRepoFromTemplate = vi.fn();
	const inviteWriteCollaborator = vi.fn();
	const findActiveByUserId = vi.fn();
	const upsertInvited = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGithubKitRuntime).mockReturnValue({ config: kitConfig, oauthConfigured: true });
		vi.mocked(createConfiguredCollaboratorClient).mockReturnValue({
			generateRepoFromTemplate,
			inviteWriteCollaborator,
			removeCollaborator: vi.fn(),
		} as never);
		vi.mocked(createPrismaGithubIdentityReaderWithUserApi).mockReturnValue({
			getGithubIdentity: async () => ({ githubUserId: "42", githubLogin: "bob-dev" }),
		});
		vi.mocked(createPrismaGrantStore).mockReturnValue({
			findActiveByUserId,
			upsertInvited,
			findLatestByUserId: vi.fn(),
			findByUserRepo: vi.fn(),
			markFailed: vi.fn(),
		} as never);
	});

	it("returns 401 when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);
		vi.mocked(createPrismaEligibilityReader).mockReturnValue({
			getEligibleKitOrder: async () => ({ id: "ord_1", orderNo: "SK-1" }),
			hasKitClaimEligible: async () => true,
		});

		const response = await POST(new Request("http://localhost/api/github/claim", { method: "POST" }));

		expect(response.status).toBe(401);
		expect(generateRepoFromTemplate).not.toHaveBeenCalled();
	});

	it("returns 403 when the signed-in user is not kit-eligible", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user_unpaid" } } as never);
		vi.mocked(createPrismaEligibilityReader).mockReturnValue({
			getEligibleKitOrder: async () => null,
			hasKitClaimEligible: async () => false,
		});

		const response = await POST(new Request("http://localhost/api/github/claim", { method: "POST" }));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "not_eligible" });
		expect(generateRepoFromTemplate).not.toHaveBeenCalled();
	});

	it("does not provision a second repo when a grant already exists (idempotent 200, not 4xx)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user_paid" } } as never);
		vi.mocked(createPrismaEligibilityReader).mockReturnValue({
			getEligibleKitOrder: async () => ({ id: "ord_1", orderNo: "SK-1" }),
			hasKitClaimEligible: async () => true,
		});
		findActiveByUserId.mockResolvedValue([{ id: "grant-existing" }]);

		const response = await POST(new Request("http://localhost/api/github/claim", { method: "POST" }));

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ ok: true, grantId: "grant-existing" });
		expect(generateRepoFromTemplate).not.toHaveBeenCalled();
		expect(upsertInvited).not.toHaveBeenCalled();
	});
});
