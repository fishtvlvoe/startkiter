import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const MAX_WATCHED_SECONDS = 366 * 24 * 60 * 60;

export const recordWatchTime = protectedProcedure
	.route({
		method: "POST",
		path: "/course/watch-time",
		tags: ["Course"],
		summary: "Record learner lesson watch time",
	})
	.input(
		z.object({
			lessonId: z.string().trim().min(1).max(200),
			watchedSec: z.number().int().min(0).max(MAX_WATCHED_SECONDS),
		}),
	)
	.handler(async ({ input, context }) => {
		await db.$executeRaw`
			INSERT INTO "watch_time_log" ("id", "userId", "lessonId", "watchedSec", "lastWatchAt")
			VALUES (${randomUUID()}, ${context.user.id}, ${input.lessonId}, ${input.watchedSec}, NOW())
			ON CONFLICT ("userId", "lessonId") DO UPDATE
			SET "watchedSec" = GREATEST("watch_time_log"."watchedSec", EXCLUDED."watchedSec"),
				"lastWatchAt" = NOW()
		`;

		return { recorded: true };
	});
