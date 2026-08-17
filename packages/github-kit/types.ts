export type GithubKitConfig = {
	appId: string;
	installationId: string;
	privateKeyPem: string;
	org: string;
	repo: string;
};

export type GithubIdentity = {
	githubUserId: string;
	githubLogin: string;
};

export type GithubKitGrantStatus = "invited" | "accepted" | "revoked" | "failed";

export type GithubKitGrantRecord = {
	id: string;
	userId: string;
	githubUserId: string;
	githubLogin: string;
	org: string;
	repo: string;
	permission: string;
	status: GithubKitGrantStatus;
	orderNo: string | null;
	acceptedAt?: Date | null;
	revokedAt?: Date | null;
};

export type GithubCollaboratorClient = {
	invitePullCollaborator: (args: {
		org: string;
		repo: string;
		username: string;
	}) => Promise<void>;
	removeCollaborator: (args: {
		org: string;
		repo: string;
		username: string;
	}) => Promise<void>;
};

export type KitEligibilityReader = {
	hasKitClaimEligible: (userId: string) => Promise<boolean>;
};

export type GithubIdentityReader = {
	getGithubIdentity: (userId: string) => Promise<GithubIdentity | null>;
};

export type GithubKitGrantStore = {
	findByUserRepo: (args: {
		userId: string;
		org: string;
		repo: string;
	}) => Promise<GithubKitGrantRecord | null>;
	findActiveByUserId: (userId: string) => Promise<GithubKitGrantRecord[]>;
	upsertInvited: (args: {
		userId: string;
		githubUserId: string;
		githubLogin: string;
		org: string;
		repo: string;
		orderNo?: string | null;
	}) => Promise<GithubKitGrantRecord>;
	upsertFailed: (args: {
		userId: string;
		githubUserId: string;
		githubLogin: string;
		org: string;
		repo: string;
		orderNo?: string | null;
	}) => Promise<GithubKitGrantRecord>;
	markStatus: (args: {
		userId: string;
		org: string;
		repo: string;
		status: GithubKitGrantStatus;
		revokedAt?: Date | null;
	}) => Promise<GithubKitGrantRecord | null>;
};
