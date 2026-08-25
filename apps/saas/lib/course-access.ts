import { getCourseAccessOrdersForUser } from "@startkiter/database";
import { canAccessCourse, type CourseAccessReader } from "@startkiter/course";

export function createPrismaCourseAccessReader(): CourseAccessReader {
	return {
		findOrdersForUser: getCourseAccessOrdersForUser,
	};
}

export async function userHasCourseAccess(userId: string): Promise<boolean> {
	return canAccessCourse(userId, createPrismaCourseAccessReader());
}
