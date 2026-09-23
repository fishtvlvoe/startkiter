import { db } from "@startkiter/database";

import { manageableCourseWhereForUser } from "./course-instructor-access";

export type CourseDashboardMetrics = {
	publishedCourseCount: number;
	studentCount: number;
	revenueLast30Days: number;
};

/**
 * Build the operator dashboard from the existing course, enrollment, and order
 * tables. Course scope is resolved before any aggregate is returned.
 */
export async function getCourseDashboardMetrics(userId: string): Promise<CourseDashboardMetrics> {
	const manageableWhere = await manageableCourseWhereForUser(userId);
	const courses = await db.course.findMany({
		where: { ...manageableWhere, status: "PUBLISHED" },
		select: { id: true, slug: true },
	});
	const courseIds = courses.map((course) => course.id);
	if (courseIds.length === 0) {
		return { publishedCourseCount: 0, studentCount: 0, revenueLast30Days: 0 };
	}

	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const [subscriptions, inviteRedemptions, orders] = await Promise.all([
		db.courseSubscription.findMany({
			where: { courseId: { in: courseIds }, status: "ACTIVE" },
			select: { userId: true },
			distinct: ["userId"],
		}),
		db.courseInviteRedemption.findMany({
			where: { courseId: { in: courseIds } },
			select: { userId: true },
			distinct: ["userId"],
		}),
		db.order.findMany({
			where: {
				status: "paid",
				paidAt: { gte: since },
				courseAccess: true,
			},
			select: { amount: true, userId: true, sku: true },
		}),
	]);

	const students = new Set([...subscriptions, ...inviteRedemptions].map((row) => row.userId));
	const scopedSlugs = new Set(courses.map((course) => course.slug));
	const scopedOrders = orders.filter((order) => !("OR" in manageableWhere) || scopedSlugs.has(order.sku));
	for (const order of scopedOrders) students.add(order.userId);

	return {
		publishedCourseCount: courses.length,
		studentCount: students.size,
		revenueLast30Days: scopedOrders.reduce((total, order) => total + order.amount, 0),
	};
}
