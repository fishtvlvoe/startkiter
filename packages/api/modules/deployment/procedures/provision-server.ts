import { ORPCError } from "@orpc/server";
import {
	addServerToCoolify,
	classifyTier,
	createApplication,
	guardCoolifyProvision,
	requireCoolifyApiToken,
	upsertBuyerDeployment,
	validateSshHandoff,
} from "@startkiter/platform";
import { logger } from "@startkiter/logs";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const provisionServer = protectedProcedure
	.route({
		method: "POST",
		path: "/deployment/provision",
		tags: ["Deployment"],
		summary: "Hand off a buyer-owned VPS to be added to StartKiter's Coolify fleet",
		description: "Validates the buyer's tier and SSH handoff details before triggering Coolify server registration",
	})
	.input(
		z.object({
			tier: z.string(),
			ip: z.string(),
			publicKey: z.string(),
		}),
	)
	.output(z.object({ accepted: z.literal(true) }))
	.handler(async ({ input, context: { user } }) => {
		const tierResult = classifyTier(input.tier);
		if (!tierResult.ok) {
			throw new ORPCError("BAD_REQUEST", { message: "Unknown deployment tier" });
		}

		const guard = guardCoolifyProvision(tierResult.tier);
		if (!guard.allowed) {
			throw new ORPCError("FORBIDDEN", { message: "This tier does not provision a Coolify-managed server" });
		}

		const sshResult = validateSshHandoff({ ip: input.ip, publicKey: input.publicKey });
		if (!sshResult.ok) {
			throw new ORPCError("BAD_REQUEST", { message: sshResult.message });
		}

		const tokenResult = requireCoolifyApiToken(process.env);
		if (!tokenResult.ok) {
			logger.error("COOLIFY_API_TOKEN missing, cannot provision server");
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Deployment service is temporarily unavailable" });
		}

		const projectUuid = process.env.COOLIFY_PROJECT_UUID?.trim();
		const repoUrl = process.env.COOLIFY_APP_REPO_URL?.trim();
		const branch = process.env.COOLIFY_APP_GIT_BRANCH?.trim() || "main";
		if (!projectUuid || !repoUrl) {
			logger.error("Coolify project or application repo is not configured, cannot provision server");
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Deployment service is temporarily unavailable" });
		}

		const serverResult = await addServerToCoolify({
			ip: input.ip,
			publicKey: input.publicKey,
			name: `buyer-${user.id}`,
			apiToken: tokenResult.token,
			privateKeyUuid: process.env.COOLIFY_PRIVATE_KEY_UUID?.trim(),
		});
		if (!serverResult.ok) {
			logger.error("Coolify add-server failed", { kind: serverResult.kind, userId: user.id });
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Deployment service is temporarily unavailable" });
		}

		const appResult = await createApplication({
			serverId: serverResult.data.uuid,
			repoUrl,
			branch,
			apiToken: tokenResult.token,
			projectUuid,
		});
		if (!appResult.ok) {
			await upsertBuyerDeployment({
				userId: user.id,
				tier: "managed",
				coolifyServerId: serverResult.data.uuid,
				publicUrl: `https://${input.ip}`,
				status: "error",
			});
			logger.error("Coolify create-application failed", { kind: appResult.kind, userId: user.id });
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Deployment service is temporarily unavailable" });
		}

		await upsertBuyerDeployment({
			userId: user.id,
			tier: "managed",
			coolifyServerId: serverResult.data.uuid,
			coolifyAppId: appResult.data.uuid,
			publicUrl: `https://${input.ip}`,
			status: "provisioning",
		});

		return { accepted: true };
	});
