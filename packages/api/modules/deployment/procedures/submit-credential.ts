import { ORPCError } from "@orpc/server";
import {
	acceptCredentialHandoff,
	CREDENTIAL_ENV_KEY_ALLOWLIST,
	findBuyerDeploymentForUser,
	redeployApplication,
	requireCoolifyApiToken,
	setApplicationEnv,
	upsertBuyerDeployment,
} from "@startkiter/platform";
import { logger } from "@startkiter/logs";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const submitCredential = protectedProcedure
	.route({
		method: "POST",
		path: "/deployment/credentials",
		tags: ["Deployment"],
		summary: "Hand off a third-party credential to be written into the buyer's deployment environment",
		description:
			"Accepts an email/payment/domain-dns credential from the buyer's AI conversation interface. " +
			"The value is written to the target environment variable only; it is never logged or persisted in StartKiter's own database.",
	})
	.input(
		z.object({
			kind: z.enum(["email", "payment", "domain-dns"]),
			targetEnvKey: z.enum(CREDENTIAL_ENV_KEY_ALLOWLIST),
			value: z.string().min(1),
		}),
	)
	.output(z.object({ accepted: z.literal(true) }))
	.handler(async ({ input, context: { user } }) => {
		const deployment = await findBuyerDeploymentForUser(user.id);
		if (!deployment?.coolifyAppId) {
			throw new ORPCError("NOT_FOUND", { message: "No managed deployment found for this account" });
		}

		const tokenResult = requireCoolifyApiToken(process.env);
		if (!tokenResult.ok) {
			logger.error("COOLIFY_API_TOKEN missing, cannot write deployment credential");
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Deployment service is temporarily unavailable" });
		}

		const pendingWrites: { envKey: string; value: string }[] = [];
		const result = acceptCredentialHandoff(input, {
			writeEnv: (envKey, value) => {
				pendingWrites.push({ envKey, value });
			},
			log: (message) => logger.info(message),
		});

		if (!result.ok) {
			throw new ORPCError("BAD_REQUEST", { message: "Environment key is not on the allowed list" });
		}

		const write = pendingWrites[0];
		if (!write) {
			throw new ORPCError("BAD_REQUEST", { message: "Environment key is not on the allowed list" });
		}

		const envResult = await setApplicationEnv({
			appId: deployment.coolifyAppId,
			key: write.envKey,
			value: write.value,
			apiToken: tokenResult.token,
		});
		if (!envResult.ok) {
			logger.error("Coolify set-env failed", { kind: envResult.kind, envKey: write.envKey, userId: user.id });
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Deployment service is temporarily unavailable" });
		}

		const redeployResult = await redeployApplication({
			appId: deployment.coolifyAppId,
			apiToken: tokenResult.token,
		});
		if (!redeployResult.ok) {
			await upsertBuyerDeployment({
				userId: user.id,
				tier: deployment.tier,
				coolifyServerId: deployment.coolifyServerId,
				coolifyAppId: deployment.coolifyAppId,
				publicUrl: deployment.publicUrl,
				status: "error",
			});
			logger.error("Coolify redeploy failed after env write", {
				kind: redeployResult.kind,
				envKey: write.envKey,
				userId: user.id,
			});
			throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Deployment service is temporarily unavailable" });
		}

		return { accepted: true };
	});
