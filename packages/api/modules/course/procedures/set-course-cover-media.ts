import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

export const setCourseCoverMedia = courseOperatorProcedure
	.route({ method: "POST", path: "/course/media/course-cover", tags: ["Course media"], summary: "Set a course cover from media" })
	.input(z.object({ courseId: z.string().trim().min(1).max(200), mediaId: z.string().trim().min(1).max(200) }))
	.handler(async ({ input }) => {
		const media = await db.media.findUnique({ where: { id: input.mediaId }, select: { id: true, type: true, url: true } });
		if (!media || media.type !== "IMAGE") throw new ORPCError("BAD_REQUEST", { message: "只能使用圖片媒體作為課程封面。" });

		const result = await db.$transaction(async (tx) => {
			await tx.media.updateMany({ where: { usageType: "COURSE_COVER", usageId: input.courseId }, data: { usageType: "MANUAL", usageId: null } });
			await tx.media.update({ where: { id: input.mediaId }, data: { usageType: "COURSE_COVER", usageId: input.courseId } });
			return tx.course.update({ where: { id: input.courseId }, data: { coverImageUrl: media.url } });
		});
		return { course: result, mediaId: input.mediaId };
	});
