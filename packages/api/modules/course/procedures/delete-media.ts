import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

export const deleteMedia = courseOperatorProcedure
	.route({ method: "DELETE", path: "/course/media/{id}", tags: ["Course media"], summary: "Delete unused course media" })
	.input(z.object({ id: z.string().trim().min(1).max(200) }))
	.handler(async ({ input }) => {
		const media = await db.media.findUnique({ where: { id: input.id }, select: { id: true, usageId: true } });
		if (!media) throw new ORPCError("NOT_FOUND", { message: "找不到這份媒體。" });
		if (media.usageId) throw new ORPCError("BAD_REQUEST", { message: "IN_USE", data: { error: "IN_USE" } });
		await db.media.delete({ where: { id: input.id } });
		return { deleted: true };
	});
