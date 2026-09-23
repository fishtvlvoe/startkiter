import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { adminProcedure } from "../../../orpc/procedures";

export const setInstructorRole = adminProcedure
	.route({ method: "POST", path: "/admin/users/instructor-role", tags: ["Administration"], summary: "Assign or revoke instructor role" })
	.input(z.object({ userId: z.string().trim().min(1), role: z.enum(["instructor", "user"]) }))
	.handler(async ({ input, context }) => {
		if (input.userId === context.user.id) throw new ORPCError("BAD_REQUEST", { message: "不能變更自己的講師角色。" });
		const user = await db.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true } });
		if (!user) throw new ORPCError("NOT_FOUND");
		return db.user.update({ where: { id: input.userId }, data: { role: input.role }, select: { id: true, role: true } });
	});
