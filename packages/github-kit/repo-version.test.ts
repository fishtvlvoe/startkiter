import { describe, expect, it } from "vitest";

import { getRepoVersion } from "./repo-version";
import type { GithubKitConfig, GithubKitGrantRecord, GithubKitGrantStore } from "./types";

const config: GithubKitConfig = {
	appId: "1",
	installationId: "2",
	privateKeyPem: "-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
	org: "startkiter",
	repo: "shared-kit",
	templateRepo: "startkiter/kit-template",
};

function createMemoryGrants(seed: GithubKitGrantRecord[] = []): GithubKitGrantStore {
	const rows = [...seed];
	return {
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
		async markStatus() {
			throw new Error("unused");
		},
	};
}

const grant: GithubKitGrantRecord = {
	id: "g1",
	userId: "u1",
	githubUserId: "1",
	githubLogin: "bob",
	org: "startkiter",
	repo: "kit-ord_9001",
	permission: "write",
	status: "invited",
	orderNo: "SK-8800-001",
};

describe("getRepoVersion", () => {
	it("returns 401 without a session", async () => {
		const result = await getRepoVersion({
			userId: null,
			config,
			grants: createMemoryGrants([grant]),
			versions: {
				readStartkiterVersion: async () => "2026.08.20",
			},
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 401,
			error: "authentication_required",
		});
	});

	it("returns upToDate true when STARTKITER_VERSION matches", async () => {
		const result = await getRepoVersion({
			userId: "u1",
			config,
			grants: createMemoryGrants([grant]),
			versions: {
				readStartkiterVersion: async () => "2026.08.20",
			},
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.body.buyerVersion).toBe("2026.08.20");
			expect(result.body.latestVersion).toBe("2026.08.20");
			expect(result.body.upToDate).toBe(true);
		}
	});

	it("returns upToDate false and a non-empty syncPromptHint when versions differ", async () => {
		const result = await getRepoVersion({
			userId: "u1",
			config,
			grants: createMemoryGrants([grant]),
			versions: {
				readStartkiterVersion: async ({ repo }) =>
					repo === "kit-ord_9001" ? "2026.08.01" : "2026.08.20",
			},
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.body.upToDate).toBe(false);
			expect(result.body.syncPromptHint.trim().length).toBeGreaterThan(0);
			expect(result.body.buyerVersion).toBe("2026.08.01");
			expect(result.body.latestVersion).toBe("2026.08.20");
		}
	});

	it("returns upToDate null, never true, when either STARTKITER_VERSION read fails", async () => {
		const result = await getRepoVersion({
			userId: "u1",
			config,
			grants: createMemoryGrants([grant]),
			versions: {
				readStartkiterVersion: async ({ repo }) =>
					repo === "kit-ord_9001" ? "2026.08.20" : null,
			},
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.body.upToDate).toBeNull();
			expect(result.body.upToDate).not.toBe(true);
		}
	});
});
