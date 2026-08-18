import { describe, expect, it } from "vitest";

import { classifyTier, guardCoolifyProvision } from "./tiers";

describe("classifyTier", () => {
	it("rejects a tier value outside the three allowed options", () => {
		const result = classifyTier("enterprise");
		expect(result).toEqual({ ok: false, reason: "invalid_tier" });
	});

	it("accepts a valid tier value", () => {
		const result = classifyTier("managed");
		expect(result).toEqual({ ok: true, tier: "managed" });
	});
});

describe("guardCoolifyProvision", () => {
	it("blocks Coolify resource provisioning for self-hosted tier", () => {
		const result = guardCoolifyProvision("self-hosted");
		expect(result).toEqual({ allowed: false, reason: "tier_not_managed" });
	});

	it("blocks Coolify resource provisioning for advanced tier", () => {
		const result = guardCoolifyProvision("advanced");
		expect(result).toEqual({ allowed: false, reason: "tier_not_managed" });
	});

	it("allows Coolify resource provisioning for managed tier", () => {
		const result = guardCoolifyProvision("managed");
		expect(result).toEqual({ allowed: true });
	});
});
