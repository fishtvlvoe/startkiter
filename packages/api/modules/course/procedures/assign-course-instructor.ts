import { z } from "zod";

import { db } from "@startkiter/database";

import { courseOperatorProcedure } from "../lib/course-operator";

export const assignCourseInstructor = courseOperatorProcedure
	.route({
		method: "POST",
		path: "/course/instructors/assign",
		tags: ["Course"],
		summary: "Assign an instructor to a course",
	})
	.input(
		z.object({
			courseId: z.string().trim().min(1),
			userId: z.string().trim().min(1),
		}),
	)
	.handler(async ({ input, context }) => {
		await db.courseInstructor.upsert({
			where: { courseId_userId: { courseId: input.courseId, userId: input.userId } },
			update: {},
			create: {
				courseId: input.courseId,
				userId: input.userId,
				createdById: context.user.id,
			},
		});

		return { assigned: true };
	});
