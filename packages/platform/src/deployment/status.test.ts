import { describe, expect, it } from "vitest";

import { buildStatusPanelView, type CoolifyStatusProbe } from "./status";
import type { BuyerDeployment } from "./types";

function deploymentWith(overrides: Partial<BuyerDeployment> = {}): BuyerDeployment {
	return {
		id: "dep_1",
		userId: "user_1",
		tier: "managed",
		coolifyServerId: "srv_secret_internal_id",
		coolifyAppId: "app_secret_internal_id",
		publicUrl: "https://buyer-1.startkiter.dev",
		status: "live",
		lastDeployedAt: "2026-08-18T15:00:00Z",
		...overrides,
	};
}

describe("buildStatusPanelView", () => {
	it("shows unavailable, not down, when the Coolify API call fails", () => {
		const probe: CoolifyStatusProbe = { kind: "api_error" };
		const view = buildStatusPanelView(deploymentWith(), probe);
		expect(view.reachable).toBe("unavailable");
	});

	it("shows reachable true when the site is live", () => {
		const probe: CoolifyStatusProbe = {
			kind: "ok",
			reachable: true,
			publicUrl: "https://buyer-1.startkiter.dev",
			lastDeployedAt: "2026-08-18T15:00:00Z",
		};
		const view = buildStatusPanelView(deploymentWith(), probe);
		expect(view.reachable).toBe(true);
	});

	it("never exposes Coolify-internal server or app identifiers", () => {
		const probe: CoolifyStatusProbe = { kind: "ok", reachable: true, publicUrl: "https://buyer-1.startkiter.dev" };
		const view = buildStatusPanelView(deploymentWith(), probe);
		const serialized = JSON.stringify(view);
		expect(serialized).not.toContain("srv_secret_internal_id");
		expect(serialized).not.toContain("app_secret_internal_id");
	});
});
