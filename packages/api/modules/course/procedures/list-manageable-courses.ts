import { db } from "@startkiter/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { isOperator } from "@startkiter/permissions";

export const listManageableCourses = protectedProcedure
	.route({
		method: "GET",
		path: "/course/manageable-courses",
		tags: ["Course"],
		summary: "List courses manageable by the current user",
	})
	.handler(async ({ context }) => {
		const operator = isOperator(context.user, process.env.ADMIN_EMAIL);
		const courses = await db.course.findMany({
			...(operator
				? {}
				: { where: { instructors: { some: { userId: context.user.id } } } }),
			orderBy: { createdAt: "desc" },
		});

		return { courses };
	});
