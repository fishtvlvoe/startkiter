import { describe, expect, it, vi } from "vitest";

import { revokeKitGrantOnRefund } from "./revoke";
import type { GithubKitConfig, GithubKitGrantRecord, GithubKitGrantStore } from "./types";

const config: GithubKitConfig = {
	appId: "1",
	installationId: "2",
	privateKeyPem: "-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
	org: "startkiter",
	repo: "kit",
};

function createMemoryGrants(seed: GithubKitGrantRecord[] = []): GithubKitGrantStore & {
	rows: GithubKitGrantRecord[];
} {
	const rows = [...seed];
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
		async upsertInvited() {
			throw new Error("unused");
		},
		async upsertFailed() {
			throw new Error("unused");
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

describe("revokeKitGrantOnRefund", () => {
	it("does not call GitHub when no grant exists", async () => {
		const remove = vi.fn();
		const result = await revokeKitGrantOnRefund({
			userId: "user_no_grant",
			config,
			grants: createMemoryGrants(),
			collaborators: {
				invitePullCollaborator: vi.fn(),
				removeCollaborator: remove,
			},
		});
		expect(result.githubCalled).toBe(false);
		expect(remove).not.toHaveBeenCalled();
	});

	it("revokes invited grant on success", async () => {
		const remove = vi.fn(async () => undefined);
		const grants = createMemoryGrants([
			{
				id: "g1",
				userId: "user_invited",
				githubUserId: "1",
				githubLogin: "bob",
				org: "startkiter",
				repo: "kit",
				permission: "pull",
				status: "invited",
				orderNo: "SK-8800-002",
			},
		]);
		const result = await revokeKitGrantOnRefund({
			userId: "user_invited",
			config,
			grants,
			collaborators: {
				invitePullCollaborator: vi.fn(),
				removeCollaborator: remove,
			},
		});
		expect(result).toEqual({ githubCalled: true, grantStatus: "revoked" });
		expect(remove).toHaveBeenCalledTimes(1);
		expect(grants.rows[0]?.status).toBe("revoked");
	});

	it("marks failed when GitHub API fails but does not throw", async () => {
		const remove = vi.fn(async () => {
			throw new Error("github_5xx");
		});
		const grants = createMemoryGrants([
			{
				id: "g1",
				userId: "user_invited",
				githubUserId: "1",
				githubLogin: "bob",
				org: "startkiter",
				repo: "kit",
				permission: "pull",
				status: "invited",
				orderNo: null,
			},
		]);
		const result = await revokeKitGrantOnRefund({
			userId: "user_invited",
			config,
			grants,
			collaborators: {
				invitePullCollaborator: vi.fn(),
				removeCollaborator: remove,
			},
		});
		expect(result.grantStatus).toBe("failed");
		expect(grants.rows[0]?.status).toBe("failed");
	});
});
