import { db } from "@startkiter/database";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

export const listEmailDeliveryLog = courseOperatorProcedure
	.route({
		method: "GET",
		path: "/course/email-settings/delivery-log",
		tags: ["Course email"],
		summary: "List course lifecycle email delivery logs",
	})
	.input(z.object({
		type: z.enum(["WELCOME_EMAIL", "EXPIRATION_REMINDER"]).optional(),
		status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
		limit: z.number().int().min(1).max(200).default(50),
	}))
	.handler(async ({ input }) => {
		const logs = await db.emailDeliveryLog.findMany({
			where: { type: input.type, status: input.status },
			orderBy: { createdAt: "desc" },
			take: input.limit,
			include: {
				course: { select: { id: true, title: true } },
				user: { select: { id: true, name: true, email: true } },
			},
		});
		return { logs };
	});
