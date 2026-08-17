import { createDatabase } from "@startkiter/database";
import { listLessons } from "@startkiter/course";
import { MVP_SKU } from "@startkiter/payments";
import type { AgentDataAccess, AgentOrder } from "@startkiter/site-agent";

import { userHasCourseAccess } from "./course-access";

export function createPrismaAgentDataAccess(): AgentDataAccess {
	return {
		async listOrdersForUser(userId: string) {
			const db = createDatabase();
			const rows = await db.order.findMany({
				where: { userId, sku: MVP_SKU },
				orderBy: { createdAt: "desc" },
			});
			return rows.map((row: AgentOrder) => ({
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
				// 本刀無獨立 progress 表
				status: "not_tracked" as const,
			}));
			return { courseAccess, lessons };
		},
	};
}
