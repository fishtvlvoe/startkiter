import { db } from "@startkiter/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { manageableCourseWhereForUser } from "../lib/course-instructor-access";

export const listManageableCourses = protectedProcedure
	.route({
		method: "GET",
		path: "/course/manageable-courses",
		tags: ["Course"],
		summary: "List courses manageable by the current user",
	})
	.handler(async ({ context }) => {
		const courses = await db.course.findMany({
			where: await manageableCourseWhereForUser(context.user.id),
			orderBy: { createdAt: "desc" },
		});

		return { courses };
	});
