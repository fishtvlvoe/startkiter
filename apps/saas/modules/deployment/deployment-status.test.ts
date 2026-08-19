import { describe, expect, it } from "vitest";

process.env.DATABASE_URL ||= "postgresql://mock:mock@localhost:5432/mock";

import {
	buildStatusPanelView,
	classifyTier,
	guardCoolifyProvision,
	validateSshHandoff,
	type BuyerDeployment,
} from "@startkiter/platform";
import { DEFAULT_STARTKITER_SSH_PUBLIC_KEY } from "./constants";

const mockBaseDeployment: BuyerDeployment = {
	id: "dep-123",
	userId: "user-456",
	tier: "managed",
	coolifyServerId: "srv-789",
	coolifyAppId: "app-012",
	publicUrl: "https://my-store.startkiter.dev",
	status: "live",
	lastDeployedAt: "2026-08-19T08:00:00.000Z",
};

describe("Buyer Status Panel View Transformation", () => {
	it("renders live status when Coolify probe is reachable", () => {
		const view = buildStatusPanelView(mockBaseDeployment, {
			kind: "ok",
			reachable: true,
			publicUrl: "https://my-store.startkiter.dev",
			lastDeployedAt: "2026-08-19T09:00:00.000Z",
		});

		expect(view.reachable).toBe(true);
		expect(view.publicUrl).toBe("https://my-store.startkiter.dev");
		expect(view.lastDeployedAt).toBe("2026-08-19T09:00:00.000Z");
	});

	it("renders error/down status when Coolify probe reports unreachable", () => {
		const view = buildStatusPanelView(mockBaseDeployment, {
			kind: "ok",
			reachable: false,
			publicUrl: "https://my-store.startkiter.dev",
		});

		expect(view.reachable).toBe(false);
		expect(view.publicUrl).toBe("https://my-store.startkiter.dev");
	});

	it("renders 'unavailable' and DOES NOT report site-down when Coolify API fails", () => {
		const view = buildStatusPanelView(mockBaseDeployment, {
			kind: "api_error",
		});

		expect(view.reachable).toBe("unavailable");
		expect(view.publicUrl).toBe(mockBaseDeployment.publicUrl);
		expect(view.lastDeployedAt).toBe(mockBaseDeployment.lastDeployedAt);
	});
});

describe("Tier Selection & Provisioning Validation", () => {
	it("allows provisioning only for managed tier", () => {
		expect(guardCoolifyProvision("managed")).toEqual({ allowed: true });
		expect(guardCoolifyProvision("self-hosted")).toEqual({
			allowed: false,
			reason: "tier_not_managed",
		});
		expect(guardCoolifyProvision("advanced")).toEqual({
			allowed: false,
			reason: "tier_not_managed",
		});
	});

	it("classifies valid and invalid tier inputs", () => {
		expect(classifyTier("managed")).toEqual({ ok: true, tier: "managed" });
		expect(classifyTier("self-hosted")).toEqual({ ok: true, tier: "self-hosted" });
		expect(classifyTier("invalid-tier")).toEqual({ ok: false, reason: "invalid_tier" });
	});

	it("validates the default StartKiter SSH public key format", () => {
		const validation = validateSshHandoff({
			ip: "203.0.113.195",
			publicKey: DEFAULT_STARTKITER_SSH_PUBLIC_KEY,
		});

		expect(validation.ok).toBe(true);
	});

	it("rejects malformed IP addresses during handoff", () => {
		const invalidIp = validateSshHandoff({
			ip: "999.999.999.999",
			publicKey: DEFAULT_STARTKITER_SSH_PUBLIC_KEY,
		});
		expect(invalidIp.ok).toBe(false);

		const textIp = validateSshHandoff({
			ip: "not-an-ip",
			publicKey: DEFAULT_STARTKITER_SSH_PUBLIC_KEY,
		});
		expect(textIp.ok).toBe(false);
	});
});
