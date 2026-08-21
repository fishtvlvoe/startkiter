import { describe, expect, it, vi } from "vitest";

import { claimGithubKit, getClaimStatus } from "./claim";
import type {
	GithubCollaboratorClient,
	GithubIdentityReader,
	GithubKitConfig,
	GithubKitGrantRecord,
	GithubKitGrantStore,
	KitEligibilityReader,
} from "./types";

const config: GithubKitConfig = {
	appId: "1",
	installationId: "2",
	privateKeyPem: "-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
	org: "startkiter",
	repo: "shared-kit",
	templateRepo: "startkiter/kit-template",
};

function eligible(orderId = "ord_9001"): KitEligibilityReader {
	return {
		hasKitClaimEligible: async () => true,
		getEligibleKitOrder: async () => ({ id: orderId, orderNo: "SK-8800-001" }),
	};
}

function ineligible(): KitEligibilityReader {
	return {
		hasKitClaimEligible: async () => false,
		getEligibleKitOrder: async () => null,
	};
}

function identity(login = "bob-dev"): GithubIdentityReader {
	return {
		getGithubIdentity: async () => ({ githubUserId: "42", githubLogin: login }),
	};
}

function createMemoryGrants(): GithubKitGrantStore & { rows: GithubKitGrantRecord[] } {
	const rows: GithubKitGrantRecord[] = [];
	return {
		rows,
		async findByUserRepo({ userId, org, repo }) {
			return rows.find((r) => r.userId === userId && r.org === org && r.repo === repo) ?? null;
		},
		async findActiveByUserId(userId) {
			return rows.filter(
				(r) => r.userId === userId && (r.status === "invited" || r.status === "accepted"),
			);
		},
		async findLatestByUserId(userId) {
			const matches = rows.filter((r) => r.userId === userId);
			return matches[matches.length - 1] ?? null;
		},
		async upsertInvited(args) {
			const existing = rows.find(
				(r) => r.userId === args.userId && r.org === args.org && r.repo === args.repo,
			);
			if (existing) {
				existing.githubUserId = args.githubUserId;
				existing.githubLogin = args.githubLogin;
				existing.status = "invited";
				existing.permission = "write";
				existing.orderNo = args.orderNo ?? existing.orderNo;
				return existing;
			}
			const row: GithubKitGrantRecord = {
				id: `g_${rows.length + 1}`,
				userId: args.userId,
				githubUserId: args.githubUserId,
				githubLogin: args.githubLogin,
				org: args.org,
				repo: args.repo,
				permission: "write",
				status: "invited",
				orderNo: args.orderNo ?? null,
			};
			rows.push(row);
			return row;
		},
		async upsertFailed(args) {
			const existing = rows.find(
				(r) => r.userId === args.userId && r.org === args.org && r.repo === args.repo,
			);
			if (existing) {
				existing.status = "failed";
				return existing;
			}
			const row: GithubKitGrantRecord = {
				id: `g_${rows.length + 1}`,
				userId: args.userId,
				githubUserId: args.githubUserId,
				githubLogin: args.githubLogin,
				org: args.org,
				repo: args.repo,
				permission: "write",
				status: "failed",
				orderNo: args.orderNo ?? null,
			};
			rows.push(row);
			return row;
		},
		async markStatus({ userId, org, repo, status }) {
			const row = rows.find((r) => r.userId === userId && r.org === org && r.repo === repo);
			if (!row) {
				return null;
			}
			row.status = status;
			return row;
		},
	};
}

function collaborators(overrides: Partial<GithubCollaboratorClient> = {}): GithubCollaboratorClient {
	return {
		generateRepoFromTemplate: vi.fn(async () => undefined),
		inviteWriteCollaborator: vi.fn(async () => undefined),
		removeCollaborator: vi.fn(async () => undefined),
		...overrides,
	};
}

describe("claimGithubKit", () => {
	it("returns 401 without session user", async () => {
		const collab = collaborators();
		const result = await claimGithubKit({
			userId: null,
			config,
			oauthConfigured: true,
			eligibility: eligible(),
			identity: identity(),
			grants: createMemoryGrants(),
			collaborators: collab,
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 401,
			error: "authentication_required",
		});
		expect(collab.generateRepoFromTemplate).not.toHaveBeenCalled();
	});

	it("returns 403 and never generates when kitClaimEligible is false", async () => {
		const collab = collaborators();
		const result = await claimGithubKit({
			userId: "user_refunded",
			config,
			oauthConfigured: true,
			eligibility: ineligible(),
			identity: identity(),
			grants: createMemoryGrants(),
			collaborators: collab,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.httpStatus).toBe(403);
			expect(result.error).toBe("not_eligible");
		}
		expect(collab.generateRepoFromTemplate).not.toHaveBeenCalled();
	});

	it("returns 403 not 503 when ineligible even if config missing", async () => {
		const collab = collaborators();
		const result = await claimGithubKit({
			userId: "user_refunded",
			config: null,
			oauthConfigured: false,
			eligibility: ineligible(),
			identity: { getGithubIdentity: async () => null },
			grants: createMemoryGrants(),
			collaborators: collab,
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 403,
			error: "not_eligible",
		});
		expect(collab.generateRepoFromTemplate).not.toHaveBeenCalled();
	});

	it("returns 503 when eligible but kit config missing", async () => {
		const collab = collaborators();
		const grants = createMemoryGrants();
		const result = await claimGithubKit({
			userId: "user_paid",
			config: null,
			oauthConfigured: true,
			eligibility: eligible(),
			identity: identity(),
			grants,
			collaborators: collab,
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 503,
			error: "github_kit_misconfigured",
		});
		expect(collab.generateRepoFromTemplate).not.toHaveBeenCalled();
		expect(grants.rows).toHaveLength(0);
	});

	it("generates a dedicated write repo from template instead of inviting into the shared repo", async () => {
		const collab = collaborators();
		const grants = createMemoryGrants();
		const result = await claimGithubKit({
			userId: "user_paid",
			config,
			oauthConfigured: true,
			eligibility: eligible("ord_9001"),
			identity: identity("bob-dev"),
			grants,
			collaborators: collab,
		});
		expect(result.ok).toBe(true);
		expect(collab.generateRepoFromTemplate).toHaveBeenCalledTimes(1);
		expect(collab.generateRepoFromTemplate).toHaveBeenCalledWith({
			templateOwner: "startkiter",
			templateRepo: "kit-template",
			owner: "startkiter",
			name: "kit-ord_9001",
		});
		expect(collab.inviteWriteCollaborator).toHaveBeenCalledWith({
			org: "startkiter",
			repo: "kit-ord_9001",
			username: "bob-dev",
		});
		expect(grants.rows[0]?.permission).toBe("write");
		expect(grants.rows[0]?.permission).not.toBe("pull");
		expect(grants.rows[0]?.repo).toBe("kit-ord_9001");
		expect(grants.rows[0]?.status).toBe("invited");
	});

	it("never writes pull, maintain, or admin permission on success", async () => {
		const grants = createMemoryGrants();
		await claimGithubKit({
			userId: "user_paid",
			config,
			oauthConfigured: true,
			eligibility: eligible("ord_9001"),
			identity: identity(),
			grants,
			collaborators: collaborators(),
		});
		expect(grants.rows[0]?.permission).toBe("write");
		expect(["pull", "maintain", "admin"]).not.toContain(grants.rows[0]?.permission);
	});

	it("gives two buyers different dedicated repos", async () => {
		const grants = createMemoryGrants();
		await claimGithubKit({
			userId: "buyer_a",
			config,
			oauthConfigured: true,
			eligibility: eligible("ord_aaa"),
			identity: identity("alice"),
			grants,
			collaborators: collaborators(),
		});
		await claimGithubKit({
			userId: "buyer_b",
			config,
			oauthConfigured: true,
			eligibility: eligible("ord_bbb"),
			identity: identity("bob"),
			grants,
			collaborators: collaborators(),
		});
		expect(grants.rows).toHaveLength(2);
		expect(grants.rows[0]?.repo).not.toBe(grants.rows[1]?.repo);
		expect(grants.rows.map((r) => r.repo).sort()).toEqual(["kit-ord_aaa", "kit-ord_bbb"]);
	});

	it("returns 502 and does not persist a grant when GitHub generate fails", async () => {
		const grants = createMemoryGrants();
		const result = await claimGithubKit({
			userId: "user_paid",
			config,
			oauthConfigured: true,
			eligibility: eligible(),
			identity: identity(),
			grants,
			collaborators: collaborators({
				generateRepoFromTemplate: async () => {
					throw new Error("github unavailable");
				},
			}),
		});
		expect(result).toEqual({ ok: false, httpStatus: 502, error: "github_invite_failed" });
		expect(grants.rows).toHaveLength(0);
	});

	it("is idempotent when already invited without a second generate", async () => {
		const collab = collaborators();
		const grants = createMemoryGrants();
		await grants.upsertInvited({
			userId: "user_paid",
			githubUserId: "42",
			githubLogin: "bob-dev",
			org: "startkiter",
			repo: "kit-ord_9001",
		});
		const result = await claimGithubKit({
			userId: "user_paid",
			config,
			oauthConfigured: true,
			eligibility: eligible("ord_9001"),
			identity: identity(),
			grants,
			collaborators: collab,
		});
		expect(result.ok).toBe(true);
		expect(collab.generateRepoFromTemplate).not.toHaveBeenCalled();
	});
});

describe("getClaimStatus", () => {
	it("returns 503 when kit config missing so UI can hide claim buttons", async () => {
		const result = await getClaimStatus({
			userId: "u1",
			config: null,
			grants: createMemoryGrants(),
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 503,
			error: "github_kit_misconfigured",
		});
	});

	it("returns 503 when GitHub OAuth is not configured", async () => {
		const result = await getClaimStatus({
			userId: "u1",
			config,
			oauthConfigured: false,
			grants: createMemoryGrants(),
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 503,
			error: "github_kit_misconfigured",
		});
	});

	it("never calls collaborator APIs", async () => {
		const collab = collaborators();
		const grants = createMemoryGrants();
		await grants.upsertInvited({
			userId: "u1",
			githubUserId: "1",
			githubLogin: "bob",
			org: "startkiter",
			repo: "kit-ord_9001",
		});
		const result = await getClaimStatus({
			userId: "u1",
			config,
			grants,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.body.status).toBe("invited");
			expect(result.body.repo).toBe("startkiter/kit-ord_9001");
		}
		expect(collab.generateRepoFromTemplate).not.toHaveBeenCalled();
		expect(collab.removeCollaborator).not.toHaveBeenCalled();
	});
});
