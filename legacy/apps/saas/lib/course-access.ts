import { createDatabase } from "@startkiter/database";
import { canAccessCourse, type CourseAccessReader } from "@startkiter/course";
import { MVP_SKU } from "@startkiter/payments";

export function createPrismaCourseAccessReader(): CourseAccessReader {
	return {
		findOrdersForUser: async (userId: string) => {
			const db = createDatabase();
			const rows = await db.order.findMany({
				where: { userId, sku: MVP_SKU },
				select: { sku: true, courseAccess: true },
			});
			return rows;
		},
	};
}

export async function userHasCourseAccess(userId: string): Promise<boolean> {
	return canAccessCourse(userId, createPrismaCourseAccessReader());
}
