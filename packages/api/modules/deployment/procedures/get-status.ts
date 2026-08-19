import { fetchCoolifyAppStatus, findBuyerDeploymentForUser, buildStatusPanelView } from "@startkiter/platform";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/deployment/status",
		tags: ["Deployment"],
		summary: "Get buyer deployment status",
		description: "Returns the simplified status panel view for the current user's managed deployment",
	})
	.output(
		z.object({
			deployment: z
				.object({
					reachable: z.union([z.boolean(), z.literal("unavailable")]),
					publicUrl: z.string(),
					lastDeployedAt: z.string().optional(),
				})
				.nullable(),
		}),
	)
	.handler(async ({ context: { user } }) => {
		const deployment = await findBuyerDeploymentForUser(user.id);
		if (!deployment) {
			return { deployment: null };
		}

		const coolifyApiToken = process.env.COOLIFY_API_TOKEN;
		if (!coolifyApiToken || !deployment.coolifyAppId) {
			return {
				deployment: {
					reachable: "unavailable" as const,
					publicUrl: deployment.publicUrl,
					lastDeployedAt: deployment.lastDeployedAt,
				},
			};
		}

		const probe = await fetchCoolifyAppStatus(deployment.coolifyAppId, coolifyApiToken);
		return { deployment: buildStatusPanelView(deployment, probe) };
	});
