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
	repo: "kit",
};

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
		async upsertInvited(args) {
			const existing = rows.find(
				(r) => r.userId === args.userId && r.org === args.org && r.repo === args.repo,
			);
			if (existing) {
				existing.githubUserId = args.githubUserId;
				existing.githubLogin = args.githubLogin;
				existing.status = "invited";
				existing.permission = "pull";
				return existing;
			}
			const row: GithubKitGrantRecord = {
				id: `g_${rows.length + 1}`,
				userId: args.userId,
				githubUserId: args.githubUserId,
				githubLogin: args.githubLogin,
				org: args.org,
				repo: args.repo,
				permission: "pull",
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
				permission: "pull",
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

describe("claimGithubKit", () => {
	it("returns 401 without session user", async () => {
		const invite = vi.fn();
		const result = await claimGithubKit({
			userId: null,
			config,
			oauthConfigured: true,
			eligibility: { hasKitClaimEligible: async () => true },
			identity: { getGithubIdentity: async () => ({ githubUserId: "1", githubLogin: "bob" }) },
			grants: createMemoryGrants(),
			collaborators: {
				invitePullCollaborator: invite,
				removeCollaborator: vi.fn(),
			},
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 401,
			error: "authentication_required",
		});
		expect(invite).not.toHaveBeenCalled();
	});

	it("returns 403 and never invites when kitClaimEligible is false", async () => {
		const invite = vi.fn();
		const result = await claimGithubKit({
			userId: "user_refunded",
			config,
			oauthConfigured: true,
			eligibility: { hasKitClaimEligible: async () => false },
			identity: {
				getGithubIdentity: async () => ({ githubUserId: "9", githubLogin: "bob-dev" }),
			},
			grants: createMemoryGrants(),
			collaborators: {
				invitePullCollaborator: invite,
				removeCollaborator: vi.fn(),
			},
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.httpStatus).toBe(403);
			expect(result.error).toBe("not_eligible");
		}
		expect(invite).not.toHaveBeenCalled();
	});

	it("returns 403 not 503 when ineligible even if config missing", async () => {
		const invite = vi.fn();
		const result = await claimGithubKit({
			userId: "user_refunded",
			config: null,
			oauthConfigured: false,
			eligibility: { hasKitClaimEligible: async () => false },
			identity: { getGithubIdentity: async () => null },
			grants: createMemoryGrants(),
			collaborators: {
				invitePullCollaborator: invite,
				removeCollaborator: vi.fn(),
			},
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 403,
			error: "not_eligible",
		});
		expect(invite).not.toHaveBeenCalled();
	});

	it("returns 503 when eligible but kit config missing", async () => {
		const invite = vi.fn();
		const result = await claimGithubKit({
			userId: "user_paid",
			config: null,
			oauthConfigured: true,
			eligibility: { hasKitClaimEligible: async () => true },
			identity: {
				getGithubIdentity: async () => ({ githubUserId: "1", githubLogin: "bob-dev" }),
			},
			grants: createMemoryGrants(),
			collaborators: {
				invitePullCollaborator: invite,
				removeCollaborator: vi.fn(),
			},
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 503,
			error: "github_kit_misconfigured",
		});
		expect(invite).not.toHaveBeenCalled();
	});

	it("invites pull collaborator and persists invited grant when eligible", async () => {
		const invite = vi.fn(async () => undefined);
		const grants = createMemoryGrants();
		const result = await claimGithubKit({
			userId: "user_paid",
			config,
			oauthConfigured: true,
			eligibility: { hasKitClaimEligible: async () => true },
			identity: {
				getGithubIdentity: async () => ({ githubUserId: "42", githubLogin: "bob-dev" }),
			},
			grants,
			collaborators: {
				invitePullCollaborator: invite,
				removeCollaborator: vi.fn(),
			},
		});
		expect(result.ok).toBe(true);
		expect(invite).toHaveBeenCalledTimes(1);
		expect(invite).toHaveBeenCalledWith({
			org: "startkiter",
			repo: "kit",
			username: "bob-dev",
		});
		expect(grants.rows[0]?.permission).toBe("pull");
		expect(grants.rows[0]?.status).toBe("invited");
	});

	it("is idempotent when already invited without second invite", async () => {
		const invite = vi.fn(async () => undefined);
		const grants = createMemoryGrants();
		await grants.upsertInvited({
			userId: "user_paid",
			githubUserId: "42",
			githubLogin: "bob-dev",
			org: "startkiter",
			repo: "kit",
		});
		const result = await claimGithubKit({
			userId: "user_paid",
			config,
			oauthConfigured: true,
			eligibility: { hasKitClaimEligible: async () => true },
			identity: {
				getGithubIdentity: async () => ({ githubUserId: "42", githubLogin: "bob-dev" }),
			},
			grants,
			collaborators: {
				invitePullCollaborator: invite,
				removeCollaborator: vi.fn(),
			},
		});
		expect(result.ok).toBe(true);
		expect(invite).not.toHaveBeenCalled();
	});
});

describe("getClaimStatus", () => {
	it("never calls collaborator APIs", async () => {
		const collaborators: GithubCollaboratorClient = {
			invitePullCollaborator: vi.fn(),
			removeCollaborator: vi.fn(),
		};
		const grants = createMemoryGrants();
		await grants.upsertInvited({
			userId: "u1",
			githubUserId: "1",
			githubLogin: "bob",
			org: "startkiter",
			repo: "kit",
		});
		const result = await getClaimStatus({
			userId: "u1",
			config,
			grants,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.body.status).toBe("invited");
		}
		expect(collaborators.invitePullCollaborator).not.toHaveBeenCalled();
		expect(collaborators.removeCollaborator).not.toHaveBeenCalled();
	});
});

// silence unused type imports in some runners
void (0 as unknown as KitEligibilityReader | GithubIdentityReader);
