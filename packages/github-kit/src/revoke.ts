import type {
	GithubCollaboratorClient,
	GithubKitConfig,
	GithubKitGrantStore,
} from "./types";

export type RevokeOnRefundResult = {
	githubCalled: boolean;
	grantStatus: "revoked" | "failed" | "skipped" | null;
};

/** 退款後撤銷已邀請／已接受的 collaborator；無 grant 不打 API；API 失敗不拋、標 failed。 */
export async function revokeKitGrantOnRefund(args: {
	userId: string;
	config: GithubKitConfig | null;
	grants: GithubKitGrantStore;
	collaborators: GithubCollaboratorClient;
}): Promise<RevokeOnRefundResult> {
	if (!args.config) {
		return { githubCalled: false, grantStatus: "skipped" };
	}
	const grant = await args.grants.findByUserRepo({
		userId: args.userId,
		org: args.config.org,
		repo: args.config.repo,
	});
	if (!grant || (grant.status !== "invited" && grant.status !== "accepted")) {
		return { githubCalled: false, grantStatus: "skipped" };
	}

	try {
		await args.collaborators.removeCollaborator({
			org: args.config.org,
			repo: args.config.repo,
			username: grant.githubLogin,
		});
		await args.grants.markStatus({
			userId: args.userId,
			org: args.config.org,
			repo: args.config.repo,
			status: "revoked",
		});
		return { githubCalled: true, grantStatus: "revoked" };
	} catch {
		await args.grants.markStatus({
			userId: args.userId,
			org: args.config.org,
			repo: args.config.repo,
			status: "failed",
		});
		return { githubCalled: true, grantStatus: "failed" };
	}
}
