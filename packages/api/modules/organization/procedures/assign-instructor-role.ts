import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const assignInstructorRoleInput = z.object({
	organizationId: z.string().trim().min(1),
	memberId: z.string().trim().min(1),
	role: z.enum(["instructor", "user"]),
});

export const assignInstructorRole = protectedProcedure
	.route({
		method: "POST",
		path: "/organization/members/instructor-role",
		tags: ["Organizations"],
		summary: "Assign or revoke an organization instructor role",
	})
	.input(assignInstructorRoleInput)
	.output(z.object({ memberId: z.string(), role: z.enum(["instructor", "user"]) }))
	.handler(async ({ input, context }) => {
		const actor = await db.member.findUnique({
			where: {
				organizationId_userId: {
					organizationId: input.organizationId,
					userId: context.user.id,
				},
			},
			select: { role: true },
		});

		if (!actor || (actor.role !== "owner" && actor.role !== "admin")) {
			throw new ORPCError("FORBIDDEN");
		}

		const member = await db.member.findUnique({
			where: { id: input.memberId },
			select: { id: true, organizationId: true, role: true },
		});

		if (!member || member.organizationId !== input.organizationId) {
			throw new ORPCError("FORBIDDEN");
		}

		if (member.role !== "user" && member.role !== "instructor") {
			throw new ORPCError("BAD_REQUEST", {
				message: "Only organization users can be assigned or revoked as instructors",
			});
		}

		const updated = await db.member.update({
			where: { id: member.id },
			data: { role: input.role },
			select: { id: true, role: true },
		});

		return { memberId: updated.id, role: updated.role as "instructor" | "user" };
	});
