import type {
	GithubCollaboratorClient,
	GithubIdentityReader,
	GithubKitConfig,
	GithubKitGrantStore,
	KitEligibilityReader,
} from "./types";

export type ClaimResult =
	| { ok: true; status: "invited"; grantId: string }
	| {
			ok: false;
			httpStatus: 401 | 403 | 503 | 502;
			error:
				| "authentication_required"
				| "not_eligible"
				| "github_not_linked"
				| "github_kit_misconfigured"
				| "github_invite_failed";
	  };

export async function claimGithubKit(args: {
	userId: string | null | undefined;
	config: GithubKitConfig | null;
	oauthConfigured: boolean;
	eligibility: KitEligibilityReader;
	identity: GithubIdentityReader;
	grants: GithubKitGrantStore;
	collaborators: GithubCollaboratorClient;
}): Promise<ClaimResult> {
	if (!args.userId) {
		return { ok: false, httpStatus: 401, error: "authentication_required" };
	}

	const eligible = await args.eligibility.hasKitClaimEligible(args.userId);
	if (!eligible) {
		return { ok: false, httpStatus: 403, error: "not_eligible" };
	}

	if (!args.config || !args.oauthConfigured) {
		return { ok: false, httpStatus: 503, error: "github_kit_misconfigured" };
	}

	const identity = await args.identity.getGithubIdentity(args.userId);
	if (!identity) {
		return { ok: false, httpStatus: 403, error: "github_not_linked" };
	}

	const { org, repo } = args.config;
	const existing = await args.grants.findByUserRepo({
		userId: args.userId,
		org,
		repo,
	});
	if (existing && (existing.status === "invited" || existing.status === "accepted")) {
		return { ok: true, status: "invited", grantId: existing.id };
	}

	try {
		await args.collaborators.invitePullCollaborator({
			org,
			repo,
			username: identity.githubLogin,
		});
	} catch {
		await args.grants.upsertFailed({
			userId: args.userId,
			githubUserId: identity.githubUserId,
			githubLogin: identity.githubLogin,
			org,
			repo,
		});
		return { ok: false, httpStatus: 502, error: "github_invite_failed" };
	}

	const grant = await args.grants.upsertInvited({
		userId: args.userId,
		githubUserId: identity.githubUserId,
		githubLogin: identity.githubLogin,
		org,
		repo,
	});
	return { ok: true, status: "invited", grantId: grant.id };
}

export type ClaimStatusResult = {
	status: "not_claimed" | "invited" | "accepted" | "revoked" | "failed";
	githubLogin: string | null;
	repo: string | null;
};

export async function getClaimStatus(args: {
	userId: string | null | undefined;
	config: GithubKitConfig | null;
	oauthConfigured?: boolean;
	grants: GithubKitGrantStore;
}): Promise<
	| { ok: true; body: ClaimStatusResult }
	| { ok: false; httpStatus: 401; error: "authentication_required" }
	| { ok: false; httpStatus: 503; error: "github_kit_misconfigured" }
> {
	if (!args.userId) {
		return { ok: false, httpStatus: 401, error: "authentication_required" };
	}
	if (!args.config || args.oauthConfigured === false) {
		return { ok: false, httpStatus: 503, error: "github_kit_misconfigured" };
	}
	const grant = await args.grants.findByUserRepo({
		userId: args.userId,
		org: args.config.org,
		repo: args.config.repo,
	});
	if (!grant) {
		return {
			ok: true,
			body: {
				status: "not_claimed",
				githubLogin: null,
				repo: `${args.config.org}/${args.config.repo}`,
			},
		};
	}
	return {
		ok: true,
		body: {
			status: grant.status,
			githubLogin: grant.githubLogin,
			repo: `${grant.org}/${grant.repo}`,
		},
	};
}
