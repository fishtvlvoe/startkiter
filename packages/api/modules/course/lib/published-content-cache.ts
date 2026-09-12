import { db } from "@startkiter/database";

/** 5 minutes — design default when no project TTL precedent exists. */
export const PUBLISHED_CONTENT_CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

const lessonCache = new Map<string, CacheEntry<Awaited<ReturnType<typeof loadPublishedLessonById>>>>();
let curriculumCache: CacheEntry<Awaited<ReturnType<typeof loadPublishedCurriculum>>> | null = null;

function isFresh<T>(entry: CacheEntry<T> | null | undefined, now: number): entry is CacheEntry<T> {
	return !!entry && entry.expiresAt > now;
}

async function loadPublishedLessonById(lessonId: string) {
	return db.lesson.findUnique({
		where: { id: lessonId },
		include: { chapter: true },
	});
}

async function loadPublishedCurriculum() {
	return db.chapter.findMany({
		where: {
			course: { status: "PUBLISHED" },
		},
		orderBy: { order: "asc" },
		include: {
			course: {
				select: {
					title: true,
					watermarkSetting: {
						select: {
							enabled: true,
							showEmail: true,
							showCourseTitle: true,
							showTimestamp: true,
							emailDisplayMode: true,
							opacityPercent: true,
							textSize: true,
							movementMode: true,
							moveIntervalSec: true,
							tamperPauseEnabled: true,
						},
					},
				},
			},
			lessons: {
				where: { status: "PUBLISHED" },
				orderBy: { order: "asc" },
			},
		},
	});
}

export function invalidatePublishedContentCache(): void {
	lessonCache.clear();
	curriculumCache = null;
}

export async function getCachedPublishedLessonById(lessonId: string) {
	const now = Date.now();
	const cached = lessonCache.get(lessonId);
	if (isFresh(cached, now)) {
		return cached.value;
	}

	const value = await loadPublishedLessonById(lessonId);
	lessonCache.set(lessonId, {
		value,
		expiresAt: now + PUBLISHED_CONTENT_CACHE_TTL_MS,
	});
	return value;
}

export async function getCachedPublishedCurriculum() {
	const now = Date.now();
	if (isFresh(curriculumCache, now)) {
		return curriculumCache.value;
	}

	const value = await loadPublishedCurriculum();
	curriculumCache = {
		value,
		expiresAt: now + PUBLISHED_CONTENT_CACHE_TTL_MS,
	};
	return value;
}
