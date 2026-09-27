import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { createNotification } from "@startkiter/notifications";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

export const sendNotification = adminProcedure
	.route({
		method: "POST",
		path: "/admin/notifications",
		tags: ["Administration"],
		summary: "Send APP_UPDATE in-app notification to an existing user",
	})
	.input(
		z.object({
			userId: z.string().min(1),
			title: z.string().trim().min(1).max(120),
			message: z.string().trim().min(1).max(500),
		}),
	)
	.output(
		z.object({
			created: z.boolean(),
			id: z.string().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const targetUser = await db.user.findUnique({
			where: { id: input.userId },
		});

		if (!targetUser) {
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		const created = await createNotification({
			userId: input.userId,
			type: "APP_UPDATE",
			data: {
				title: input.title.trim(),
				message: input.message.trim(),
			},
		});

		if (!created) {
			return { created: false };
		}

		return { created: true, id: created.id };
	});
