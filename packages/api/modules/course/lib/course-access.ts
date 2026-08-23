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
	};
}

export async function userCanAccessCourseId(userId: string, courseId: string): Promise<boolean> {
	return canAccessCourseId(userId, courseId, createPrismaBundleCourseAccessReader());
}
