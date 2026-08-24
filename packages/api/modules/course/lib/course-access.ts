import { canAccessCourseId, type BundleCourseAccessReader } from "@startkiter/course/access";
import { db } from "@startkiter/database";

export function createPrismaBundleCourseAccessReader(): BundleCourseAccessReader {
	return {
		findGrantedSkusForUser: async (userId: string) => {
			const rows = await db.order.findMany({
				where: { userId, courseAccess: true },
				select: { sku: true },
			});
			return rows.map((row) => row.sku);
		},
		findBundleCourseIds: async (sku: string) => {
			const bundle = await db.bundle.findUnique({
				where: { id: sku },
				include: { courses: true },
			});
			if (!bundle) return null;
			return bundle.courses.map((course) => course.courseId);
		},
		hasActiveSubscription: async (userId: string, courseId: string) => {
			const subscription = await db.courseSubscription.findFirst({
				where: { userId, courseId, status: "ACTIVE" },
				select: { id: true },
			});
			return subscription != null;
		},
		hasRedeemedInvite: async (userId: string, courseId: string) => {
			const redemption = await db.courseInviteRedemption.findUnique({
				where: { userId_courseId: { userId, courseId } },
				select: { id: true },
			});
			return redemption != null;
		},
	};
}

export async function userCanAccessCourseId(userId: string, courseId: string): Promise<boolean> {
	return canAccessCourseId(userId, courseId, createPrismaBundleCourseAccessReader());
}
