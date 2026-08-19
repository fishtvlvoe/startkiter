import { db } from "@startkiter/database";

import { buildStatusPanelView, type CoolifyStatusProbe } from "./status";
import type { BuyerDeployment, BuyerDeploymentTier, StatusPanelView } from "./types";

function toBuyerDeployment(row: {
	id: string;
	userId: string;
	tier: string;
	coolifyServerId: string | null;
	coolifyAppId: string | null;
	publicUrl: string;
	customDomain: string | null;
	status: string;
	lastDeployedAt: Date | null;
}): BuyerDeployment {
	return {
		id: row.id,
		userId: row.userId,
		tier: row.tier.replace("_", "-") as BuyerDeploymentTier,
		coolifyServerId: row.coolifyServerId ?? undefined,
		coolifyAppId: row.coolifyAppId ?? undefined,
		publicUrl: row.publicUrl,
		customDomain: row.customDomain ?? undefined,
		status: row.status as BuyerDeployment["status"],
		lastDeployedAt: row.lastDeployedAt?.toISOString(),
	};
}

export async function findBuyerDeploymentForUser(userId: string): Promise<BuyerDeployment | null> {
	const row = await db.buyerDeployment.findFirst({ where: { userId } });
	return row ? toBuyerDeployment(row) : null;
}

/**
 * Status probe is injected because it comes from the Coolify API, which this
 * package does not call directly — the caller (apps/saas) owns COOLIFY_API_TOKEN.
 */
export async function getStatusPanelViewForUser(
	userId: string,
	probe: CoolifyStatusProbe,
): Promise<StatusPanelView | null> {
	const deployment = await findBuyerDeploymentForUser(userId);
	if (!deployment) {
		return null;
	}
	return buildStatusPanelView(deployment, probe);
}
