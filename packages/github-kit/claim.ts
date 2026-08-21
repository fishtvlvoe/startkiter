import { provisionBuyerRepo } from "./provision-buyer-repo";
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

	const order = await args.eligibility.getEligibleKitOrder(args.userId);
	if (!order) {
		return { ok: false, httpStatus: 403, error: "not_eligible" };
	}

	if (!args.config || !args.oauthConfigured || !args.config.templateRepo.trim()) {
		return { ok: false, httpStatus: 503, error: "github_kit_misconfigured" };
	}

	const identity = await args.identity.getGithubIdentity(args.userId);
	if (!identity) {
		return { ok: false, httpStatus: 403, error: "github_not_linked" };
	}

	const existing = await args.grants.findActiveByUserId(args.userId);
	const active = existing[0];
	if (active) {
		return { ok: true, status: "invited", grantId: active.id };
	}

	try {
		const provisioned = await provisionBuyerRepo({
			config: args.config,
			orderId: order.id,
			githubLogin: identity.githubLogin,
			collaborators: args.collaborators,
		});
		const grant = await args.grants.upsertInvited({
			userId: args.userId,
			githubUserId: identity.githubUserId,
			githubLogin: identity.githubLogin,
			org: provisioned.org,
			repo: provisioned.repo,
			orderNo: order.orderNo,
		});
		return { ok: true, status: "invited", grantId: grant.id };
	} catch {
		return { ok: false, httpStatus: 502, error: "github_invite_failed" };
	}
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
	const grant = await args.grants.findLatestByUserId(args.userId);
	if (!grant) {
		return {
			ok: true,
			body: {
				status: "not_claimed",
				githubLogin: null,
				repo: null,
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
