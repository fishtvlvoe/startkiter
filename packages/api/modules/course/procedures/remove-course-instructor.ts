import { z } from "zod";

import { db } from "@startkiter/database";

import { courseOperatorProcedure } from "../lib/course-operator";

export const removeCourseInstructor = courseOperatorProcedure
	.route({
		method: "POST",
		path: "/course/instructors/remove",
		tags: ["Course"],
		summary: "Remove an instructor from a course",
	})
	.input(
		z.object({
			courseId: z.string().trim().min(1),
			userId: z.string().trim().min(1),
		}),
	)
	.handler(async ({ input }) => {
		await db.courseInstructor.deleteMany({
			where: { courseId: input.courseId, userId: input.userId },
		});

		return { removed: true };
	});
