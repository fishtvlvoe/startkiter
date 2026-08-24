import { db } from "@startkiter/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { isCourseOperator } from "../lib/course-operator";

export const listManageableCourses = protectedProcedure
	.route({
		method: "GET",
		path: "/course/manageable-courses",
		tags: ["Course"],
		summary: "List courses manageable by the current user",
	})
	.handler(async ({ context }) => {
		const isOperator = isCourseOperator(context.user.email, process.env.ADMIN_EMAIL);
		const courses = await db.course.findMany({
			...(isOperator
				? {}
				: { where: { instructors: { some: { userId: context.user.id } } } }),
			orderBy: { createdAt: "desc" },
		});

		return { courses };
	});
