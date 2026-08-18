export type BuyerDeploymentTier = "self-hosted" | "managed" | "advanced";

export type BuyerDeploymentStatus = "provisioning" | "live" | "building" | "error" | "status-unavailable";

export type BuyerDeployment = {
	id: string;
	userId: string;
	tier: BuyerDeploymentTier;
	coolifyServerId?: string;
	coolifyAppId?: string;
	publicUrl: string;
	customDomain?: string;
	status: BuyerDeploymentStatus;
	lastDeployedAt?: string;
};

export type ThirdPartyCredentialKind = "email" | "payment" | "domain-dns";

export type ThirdPartyCredentialHandoff = {
	kind: ThirdPartyCredentialKind;
	targetEnvKey: string;
	value: string;
};

export type StatusPanelView = {
	reachable: boolean | "unavailable";
	publicUrl: string;
	lastDeployedAt?: string;
};
