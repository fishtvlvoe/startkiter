export type CourseLessonAccessInput = {
	hasCourseAccess: boolean;
	isFreePreview: boolean;
	status: string;
};

/**
 * Draft and archived lessons never leave the server. A published trial lesson
 * is readable without a paid order; every other published lesson needs access.
 */
export function canReadCourseLesson({
	hasCourseAccess,
	isFreePreview,
	status,
}: CourseLessonAccessInput) {
	return status === "PUBLISHED" && (isFreePreview || hasCourseAccess);
}
