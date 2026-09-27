import { db, getCourseAccessOrdersForUser, getEligibleKitOrderForUser } from "@startkiter/database";
import { canAccessCourse, type CourseAccessReader } from "@startkiter/course";
import { MVP_SKU } from "@startkiter/payments";

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

export async function userHasKitClaimAccess(userId: string): Promise<boolean> {
	const order = await getEligibleKitOrderForUser(userId, MVP_SKU);
	return !!order;
}

