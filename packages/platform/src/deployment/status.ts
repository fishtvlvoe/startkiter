import type { BuyerDeployment, StatusPanelView } from "./types";

export type CoolifyStatusProbe =
	| { kind: "ok"; reachable: boolean; publicUrl: string; lastDeployedAt?: string }
	| { kind: "api_error" };

export function buildStatusPanelView(deployment: BuyerDeployment, probe: CoolifyStatusProbe): StatusPanelView {
	if (probe.kind === "api_error") {
		return {
			reachable: "unavailable",
			publicUrl: deployment.publicUrl,
			lastDeployedAt: deployment.lastDeployedAt,
		};
	}
	return {
		reachable: probe.reachable,
		publicUrl: probe.publicUrl,
		lastDeployedAt: probe.lastDeployedAt ?? deployment.lastDeployedAt,
	};
}
