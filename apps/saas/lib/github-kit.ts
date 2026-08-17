import { db } from "@startkiter/database";
import {
	createGithubAppCollaboratorClient,
	isGithubOAuthConfigured,
	resolveGithubKitConfig,
	type GithubIdentityReader,
	type GithubKitGrantStore,
	type KitEligibilityReader,
} from "@startkiter/github-kit";
import { MVP_SKU } from "@startkiter/payments/constants";

export function loadGithubKitRuntime() {
	const config = resolveGithubKitConfig(process.env);
	const oauthConfigured = isGithubOAuthConfigured(process.env);
	return { config, oauthConfigured };
}

export function createPrismaEligibilityReader(): KitEligibilityReader {
	return {
		async hasKitClaimEligible(userId: string) {
			const order = await db.order.findFirst({
				where: { userId, sku: MVP_SKU, kitClaimEligible: true },
				select: { id: true },
			});
			return Boolean(order);
		},
	};
}

export function createPrismaGithubIdentityReader(): GithubIdentityReader {
	return {
		async getGithubIdentity(userId: string) {
			const account = await db.account.findFirst({
				where: { userId, providerId: "github" },
			});
			if (!account) {
				return null;
			}
			return {
				githubUserId: account.accountId,
				githubLogin: account.accountId,
			};
		},
	};
}

/**
 * Better Auth GitHub 帳號的 accountId 通常是數字 user id。
 * 邀請 API 需要 login；若 scope 有存 login 可之後擴充。
 * 暫用 accountId；若為純數字則 claim 前應以 GitHub API 解析 login（見 resolveGithubLogin）。
 */
export async function resolveGithubLoginFromAccount(args: {
	accessToken: string | null;
	accountId: string;
}): Promise<{ githubUserId: string; githubLogin: string } | null> {
	if (!/^\d+$/.test(args.accountId)) {
		return { githubUserId: args.accountId, githubLogin: args.accountId };
	}
	if (!args.accessToken) {
		return null;
	}
	const res = await fetch("https://api.github.com/user", {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${args.accessToken}`,
			"User-Agent": "startkiter-github-kit",
		},
	});
	if (!res.ok) {
		return null;
	}
	const body = (await res.json()) as { id?: number; login?: string };
	if (!body.id || !body.login) {
		return null;
	}
	return { githubUserId: String(body.id), githubLogin: body.login };
}

export function createPrismaGithubIdentityReaderWithUserApi(): GithubIdentityReader {
	return {
		async getGithubIdentity(userId: string) {
			const account = await db.account.findFirst({
				where: { userId, providerId: "github" },
			});
			if (!account) {
				return null;
			}
			return resolveGithubLoginFromAccount({
				accessToken: account.accessToken,
				accountId: account.accountId,
			});
		},
	};
}

export function createPrismaGrantStore(): GithubKitGrantStore {
	return {
		async findByUserRepo({ userId, org, repo }) {
			const row = await db.githubKitGrant.findUnique({
				where: { userId_org_repo: { userId, org, repo } },
			});
			return row;
		},
		async findActiveByUserId(userId: string) {
			return db.githubKitGrant.findMany({
				where: {
					userId,
					status: { in: ["invited", "accepted"] },
				},
			});
		},
		async upsertInvited(args) {
			return db.githubKitGrant.upsert({
				where: {
					userId_org_repo: {
						userId: args.userId,
						org: args.org,
						repo: args.repo,
					},
				},
				create: {
					userId: args.userId,
					githubUserId: args.githubUserId,
					githubLogin: args.githubLogin,
					org: args.org,
					repo: args.repo,
					permission: "pull",
					status: "invited",
					orderNo: args.orderNo ?? null,
				},
				update: {
					githubUserId: args.githubUserId,
					githubLogin: args.githubLogin,
					permission: "pull",
					status: "invited",
					orderNo: args.orderNo ?? null,
				},
			});
		},
		async upsertFailed(args) {
			return db.githubKitGrant.upsert({
				where: {
					userId_org_repo: {
						userId: args.userId,
						org: args.org,
						repo: args.repo,
					},
				},
				create: {
					userId: args.userId,
					githubUserId: args.githubUserId,
					githubLogin: args.githubLogin,
					org: args.org,
					repo: args.repo,
					permission: "pull",
					status: "failed",
					orderNo: args.orderNo ?? null,
				},
				update: {
					githubUserId: args.githubUserId,
					githubLogin: args.githubLogin,
					permission: "pull",
					status: "failed",
					orderNo: args.orderNo ?? null,
				},
			});
		},
		async markStatus({ userId, org, repo, status }) {
			const revokedAt = status === "revoked" ? new Date() : null;
			try {
				return await db.githubKitGrant.update({
					where: { userId_org_repo: { userId, org, repo } },
					data: { status, revokedAt },
				});
			} catch {
				return null;
			}
		},
	};
}

export function createConfiguredCollaboratorClient() {
	const { config } = loadGithubKitRuntime();
	if (!config) {
		return null;
	}
	return createGithubAppCollaboratorClient(config);
}
