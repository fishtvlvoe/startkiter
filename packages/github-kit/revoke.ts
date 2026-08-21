import type {
	GithubCollaboratorClient,
	GithubKitConfig,
	GithubKitGrantStore,
} from "./types";

export type RevokeOnRefundResult = {
	githubCalled: boolean;
	grantStatus: "revoked" | "failed" | "skipped" | null;
};

/** 退款後撤銷已邀請／已接受的 collaborator；目標是 grant 上的專屬 repo，不是共用常數。 */
export async function revokeKitGrantOnRefund(args: {
	userId: string;
	config: GithubKitConfig | null;
	grants: GithubKitGrantStore;
	collaborators: GithubCollaboratorClient;
}): Promise<RevokeOnRefundResult> {
	if (!args.config) {
		return { githubCalled: false, grantStatus: "skipped" };
	}
	const active = await args.grants.findActiveByUserId(args.userId);
	const grant = active[0];
	if (!grant) {
		return { githubCalled: false, grantStatus: "skipped" };
	}

	try {
		await args.collaborators.removeCollaborator({
			org: grant.org,
			repo: grant.repo,
			username: grant.githubLogin,
		});
		await args.grants.markStatus({
			userId: args.userId,
			org: grant.org,
			repo: grant.repo,
			status: "revoked",
			revokedAt: new Date(),
		});
		return { githubCalled: true, grantStatus: "revoked" };
	} catch {
		await args.grants.markStatus({
			userId: args.userId,
			org: grant.org,
			repo: grant.repo,
			status: "failed",
		});
		return { githubCalled: true, grantStatus: "failed" };
	}
}
