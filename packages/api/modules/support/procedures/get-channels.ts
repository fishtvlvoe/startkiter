import {
	getAvailableSupportChannels,
	isLineSupportConfigured,
	isTelegramSupportConfigured,
	type SupportTicketChannel,
} from "@startkiter/support";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";

export const getSupportChannels = publicProcedure
	.route({
		method: "GET",
		path: "/support/channels",
		tags: ["Support"],
		summary: "Get available support channels",
		description:
			"Returns available support channels based on current environment configuration",
	})
	.input(z.void().optional())
	.output(
		z.object({
			channels: z.array(z.enum(["WEB_WIDGET", "LINE", "TELEGRAM"])),
			line: z.boolean(),
			telegram: z.boolean(),
			webWidget: z.boolean(),
		}),
	)
	.handler(async () => {
		const line = isLineSupportConfigured();
		const telegram = isTelegramSupportConfigured();
		const channels = getAvailableSupportChannels();

		return {
			channels,
			line,
			telegram,
			webWidget: true,
		};
	});
