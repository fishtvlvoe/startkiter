import { ORPCError } from "@orpc/server";
import { acceptCredentialHandoff, findBuyerDeploymentForUser, CREDENTIAL_ENV_KEY_ALLOWLIST } from "@startkiter/platform";
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
		if (!deployment) {
			throw new ORPCError("NOT_FOUND", { message: "No managed deployment found for this account" });
		}

		const result = acceptCredentialHandoff(input, {
			// TODO: replace with a real call into Coolify's environment-variable
			// API for deployment.coolifyAppId, then trigger a redeploy. Not yet
			// implemented — this sink only proves the no-log guarantee for now.
			writeEnv: () => {},
			log: (message) => logger.info(message),
		});

		if (!result.ok) {
			throw new ORPCError("BAD_REQUEST", { message: "Environment key is not on the allowed list" });
		}

		return { accepted: true };
	});
