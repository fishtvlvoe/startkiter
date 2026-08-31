import { listLessons } from "@startkiter/course";
import { db } from "@startkiter/database";
import type { AgentDataAccess } from "@startkiter/site-agent";

import { userHasCourseAccess } from "../../../lib/course-access";

export function createPrismaAgentDataAccess(): AgentDataAccess {
	return {
		async listOrdersForUser(userId: string) {
			const rows = await db.order.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				select: {
					orderNo: true,
					sku: true,
					status: true,
					amount: true,
					courseAccess: true,
					kitClaimEligible: true,
				},
			});
			return rows.map((row) => ({
				orderNo: row.orderNo,
				sku: row.sku,
				status: row.status,
				amount: row.amount,
				courseAccess: row.courseAccess,
				kitClaimEligible: row.kitClaimEligible,
			}));
		},
		async listCourseProgressForUser(userId: string) {
			const courseAccess = await userHasCourseAccess(userId);
			const lessons = listLessons().map((lesson) => ({
				lessonId: lesson.id,
				title: lesson.title,
				status: "not_tracked" as const,
			}));
			return { courseAccess, lessons };
		},
	};
}
