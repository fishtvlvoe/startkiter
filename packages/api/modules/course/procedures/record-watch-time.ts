import { randomUUID } from "node:crypto";

import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { userCanAccessCourseId } from "../lib/course-access";

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
		const lesson = await db.lesson.findUnique({
			where: { id: input.lessonId },
			select: {
				status: true,
				isFreePreview: true,
				chapter: { select: { courseId: true } },
			},
		});

		if (!lesson || lesson.status !== "PUBLISHED") {
			throw new ORPCError("NOT_FOUND", { message: "找不到這個單元。" });
		}

		if (!lesson.isFreePreview) {
			const allowed = await userCanAccessCourseId(context.user.id, lesson.chapter.courseId);
			if (!allowed) {
				throw new ORPCError("FORBIDDEN", { message: "你沒有這個單元的觀看權限。" });
			}
		}

		await db.$executeRaw`
			INSERT INTO "watch_time_log" ("id", "userId", "lessonId", "watchedSec", "lastWatchAt")
			VALUES (${randomUUID()}, ${context.user.id}, ${input.lessonId}, ${input.watchedSec}, NOW())
			ON CONFLICT ("userId", "lessonId") DO UPDATE
			SET "watchedSec" = GREATEST("watch_time_log"."watchedSec", EXCLUDED."watchedSec"),
				"lastWatchAt" = NOW()
		`;

		return { recorded: true };
	});
