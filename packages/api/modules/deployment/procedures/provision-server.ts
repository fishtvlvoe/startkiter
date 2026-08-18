import { ORPCError } from "@orpc/server";
import { classifyTier, guardCoolifyProvision, requireCoolifyApiToken, validateSshHandoff } from "@startkiter/platform";
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
	.handler(async ({ input }) => {
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

		// TODO: call Coolify's "Add Server" API with tokenResult.token, input.ip,
		// input.publicKey and persist the resulting BuyerDeployment row. Not yet
		// implemented — this endpoint currently only validates the handoff.
		return { accepted: true };
	});
