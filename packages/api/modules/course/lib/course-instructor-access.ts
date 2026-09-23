import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { isOperator } from "@startkiter/permissions";

async function isCourseOperatorUser(userId: string): Promise<boolean> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { email: true, role: true },
	});

	return isOperator(user, process.env.ADMIN_EMAIL);
}

export async function hasAnyCourseInstructorAssignment(userId: string): Promise<boolean> {
	const assignment = await db.courseInstructor.findFirst({
		where: { userId },
		select: { id: true },
	});

	return assignment !== null;
}

export async function canManageCourse({
	userId,
	courseId,
	isOperator,
}: {
	userId: string;
	courseId: string;
	isOperator: boolean;
}): Promise<boolean> {
	if (isOperator) return true;

	const assignment = await db.courseInstructor.findUnique({
		where: { courseId_userId: { courseId, userId } },
		select: { id: true },
	});

	if (assignment) return true;
	// Keep a missing relation mock fail-closed in API unit tests; production
	// Prisma clients always expose findFirst.
	if (typeof db.courseInstructor.findFirst !== "function") return false;

	// An unassigned course is available to every instructor; once a course has
	// an explicit assignment list, only listed instructors may manage it.
	const hasExplicitAssignments = await db.courseInstructor.findFirst({
		where: { courseId },
		select: { id: true },
	});
	if (hasExplicitAssignments !== null) return false;

	const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
	return user?.role === "instructor";
}

/**
 * Enforce course management access at the server boundary.
 * Keep the failure deliberately opaque so callers cannot use authorization
 * checks to probe whether another course exists.
 */
export async function requireCourseManageAccess(userId: string, courseId: string): Promise<void> {
	const operator = await isCourseOperatorUser(userId);
	if (await canManageCourse({ userId, courseId, isOperator: operator })) return;

	throw new ORPCError("FORBIDDEN", { message: "無權管理此課程。" });
}

/** Prisma filter shared by every course-management list query. */
export async function manageableCourseWhereForUser(userId: string) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { email: true, role: true },
	});
	if (isOperator(user, process.env.ADMIN_EMAIL)) return {};

	if (user?.role === "instructor") {
		return {
			OR: [{ instructors: { none: {} } }, { instructors: { some: { userId } } }],
		};
	}

	// A legacy CourseInstructor assignment still grants access to that course,
	// but does not grant a role=user account access to every unassigned course.
	return { instructors: { some: { userId } } };
}
