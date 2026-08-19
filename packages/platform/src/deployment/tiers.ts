import type { BuyerDeploymentTier } from "./types";

const VALID_TIERS: readonly BuyerDeploymentTier[] = ["self-hosted", "managed", "advanced"];

export type TierClassificationResult = { ok: true; tier: BuyerDeploymentTier } | { ok: false; reason: "invalid_tier" };

export function classifyTier(input: string): TierClassificationResult {
	if ((VALID_TIERS as readonly string[]).includes(input)) {
		return { ok: true, tier: input as BuyerDeploymentTier };
	}
	return { ok: false, reason: "invalid_tier" };
}

export type ProvisionGuardResult = { allowed: true } | { allowed: false; reason: "tier_not_managed" };

export function guardCoolifyProvision(tier: BuyerDeploymentTier): ProvisionGuardResult {
	if (tier !== "managed") {
		return { allowed: false, reason: "tier_not_managed" };
	}
	return { allowed: true };
}
