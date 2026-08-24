import { db } from "@startkiter/database";

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

	return assignment !== null;
}
