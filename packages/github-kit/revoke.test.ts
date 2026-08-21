import { describe, expect, it, vi } from "vitest";

import { revokeKitGrantOnRefund } from "./revoke";
import type { GithubKitConfig, GithubKitGrantRecord, GithubKitGrantStore } from "./types";

const config: GithubKitConfig = {
	appId: "1",
	installationId: "2",
	privateKeyPem: "-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
	org: "startkiter",
	repo: "shared-kit",
	templateRepo: "startkiter/kit-template",
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
		async findLatestByUserId(userId) {
			const matches = rows.filter((r) => r.userId === userId);
			return matches[matches.length - 1] ?? null;
		},
		async upsertInvited() {
			throw new Error("unused");
		},
		async upsertFailed() {
			throw new Error("unused");
		},
		async markStatus({ userId, org, repo, status, revokedAt }) {
			const row = rows.find((r) => r.userId === userId && r.org === org && r.repo === repo);
			if (!row) {
				return null;
			}
			row.status = status;
			row.revokedAt = revokedAt ?? row.revokedAt ?? null;
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
				generateRepoFromTemplate: vi.fn(),
				inviteWriteCollaborator: vi.fn(),
				removeCollaborator: remove,
			},
		});
		expect(result.githubCalled).toBe(false);
		expect(remove).not.toHaveBeenCalled();
	});

	it("revokes the dedicated buyer repo, not the shared kit constant", async () => {
		const remove = vi.fn(async () => undefined);
		const grants = createMemoryGrants([
			{
				id: "g1",
				userId: "user_invited",
				githubUserId: "1",
				githubLogin: "bob",
				org: "startkiter",
				repo: "kit-ord_9001",
				permission: "write",
				status: "invited",
				orderNo: "SK-8800-002",
			},
		]);
		const result = await revokeKitGrantOnRefund({
			userId: "user_invited",
			config,
			grants,
			collaborators: {
				generateRepoFromTemplate: vi.fn(),
				inviteWriteCollaborator: vi.fn(),
				removeCollaborator: remove,
			},
		});
		expect(result).toEqual({ githubCalled: true, grantStatus: "revoked" });
		expect(remove).toHaveBeenCalledTimes(1);
		expect(remove).toHaveBeenCalledWith({
			org: "startkiter",
			repo: "kit-ord_9001",
			username: "bob",
		});
		expect(remove).not.toHaveBeenCalledWith(
			expect.objectContaining({ repo: "shared-kit" }),
		);
		expect(grants.rows[0]?.status).toBe("revoked");
		expect(grants.rows[0]?.revokedAt).toBeInstanceOf(Date);
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
				repo: "kit-ord_9001",
				permission: "write",
				status: "invited",
				orderNo: null,
			},
		]);
		const result = await revokeKitGrantOnRefund({
			userId: "user_invited",
			config,
			grants,
			collaborators: {
				generateRepoFromTemplate: vi.fn(),
				inviteWriteCollaborator: vi.fn(),
				removeCollaborator: remove,
			},
		});
		expect(result.grantStatus).toBe("failed");
		expect(grants.rows[0]?.status).toBe("failed");
	});
});
