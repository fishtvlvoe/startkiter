import { db, getCourseAccessOrdersForUser } from "@startkiter/database";
import { canAccessCourse, type CourseAccessReader } from "@startkiter/course";

export function createPrismaCourseAccessReader(): CourseAccessReader {
	return {
		findOrdersForUser: getCourseAccessOrdersForUser,
		getUserRole: async (userId: string) => {
			const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
			return user?.role ?? null;
		},
	};
}

export async function userHasCourseAccess(userId: string): Promise<boolean> {
	return canAccessCourse(userId, createPrismaCourseAccessReader());
}
