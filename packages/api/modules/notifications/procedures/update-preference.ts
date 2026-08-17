import { NotificationTargetSchema, NotificationTypeSchema } from "@startkiter/database";
import { setNotificationDisabled } from "@startkiter/notifications";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const updatePreference = protectedProcedure
	.route({
		method: "PUT",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Update a notification preference",
	})
	.input(
		z.object({
			type: NotificationTypeSchema,
			target: NotificationTargetSchema,
			disabled: z.boolean(),
		}),
	)
	.output(
		z.object({
			ok: z.literal(true),
		}),
	)
	.handler(async ({ input: { type, target, disabled }, context: { user } }) => {
		await setNotificationDisabled(user.id, type, target, disabled);
		return { ok: true };
	});
