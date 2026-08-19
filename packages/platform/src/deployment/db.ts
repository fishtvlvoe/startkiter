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

function toPrismaTier(tier: BuyerDeploymentTier): "self_hosted" | "managed" | "advanced" {
	if (tier === "self-hosted") {
		return "self_hosted";
	}
	return tier;
}

function toPrismaStatus(status: BuyerDeployment["status"]): "provisioning" | "live" | "building" | "error" {
	if (status === "status-unavailable") {
		return "error";
	}
	return status;
}

export async function upsertBuyerDeployment(input: {
	userId: string;
	tier: BuyerDeploymentTier;
	coolifyServerId?: string;
	coolifyAppId?: string;
	publicUrl: string;
	status: BuyerDeployment["status"];
}): Promise<BuyerDeployment> {
	const existing = await db.buyerDeployment.findFirst({ where: { userId: input.userId } });
	const data = {
		tier: toPrismaTier(input.tier),
		coolifyServerId: input.coolifyServerId ?? null,
		coolifyAppId: input.coolifyAppId ?? null,
		publicUrl: input.publicUrl,
		status: toPrismaStatus(input.status),
	};

	const row = existing
		? await db.buyerDeployment.update({ where: { id: existing.id }, data })
		: await db.buyerDeployment.create({
				data: {
					userId: input.userId,
					...data,
				},
			});

	return toBuyerDeployment(row);
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
