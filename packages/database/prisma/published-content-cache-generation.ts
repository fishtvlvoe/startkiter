/**
 * Generation counter for published course content caches.
 *
 * Bumped centrally from the Prisma write extension whenever Course / Chapter /
 * Lesson / watermark rows change, so route handlers do not need to remember
 * to invalidate individually.
 */

const COURSE_CONTENT_WRITE_MODELS = new Set([
	"Course",
	"Chapter",
	"Lesson",
	"CourseVideoWatermarkSetting",
]);

const COURSE_CONTENT_WRITE_OPERATIONS = new Set([
	"create",
	"createMany",
	"createManyAndReturn",
	"update",
	"updateMany",
	"updateManyAndReturn",
	"upsert",
	"delete",
	"deleteMany",
]);

let generation = 0;

export function getPublishedContentCacheGeneration(): number {
	return generation;
}

export function bumpPublishedContentCacheGeneration(): number {
	generation += 1;
	return generation;
}

/** @internal test helper — resets generation without going through writes */
export function resetPublishedContentCacheGenerationForTests(): void {
	generation = 0;
}

export function isCourseContentWrite(
	model: string | undefined,
	operation: string,
): boolean {
	return (
		typeof model === "string" &&
		COURSE_CONTENT_WRITE_MODELS.has(model) &&
		COURSE_CONTENT_WRITE_OPERATIONS.has(operation)
	);
}
