import {
	bumpPublishedContentCacheGeneration,
	db,
	getPublishedContentCacheGeneration,
} from "@startkiter/database";

/** 5 minutes — design default when no project TTL precedent exists. */
export const PUBLISHED_CONTENT_CACHE_TTL_MS = 5 * 60 * 1000;

/** Cap lesson entries so forged IDs cannot grow the Map without bound. */
export const PUBLISHED_LESSON_CACHE_MAX_ENTRIES = 500;

type CacheEntry<T> = {
	value: T;
	expiresAt: number;
	generation: number;
};

const lessonCache = new Map<
	string,
	CacheEntry<Awaited<ReturnType<typeof loadPublishedLessonById>>>
>();
let curriculumCache: CacheEntry<Awaited<ReturnType<typeof loadPublishedCurriculum>>> | null =
	null;

function isFresh<T>(
	entry: CacheEntry<T> | null | undefined,
	now: number,
	generation: number,
): entry is CacheEntry<T> {
	return !!entry && entry.expiresAt > now && entry.generation === generation;
}

function setLessonCacheEntry(
	lessonId: string,
	entry: CacheEntry<Awaited<ReturnType<typeof loadPublishedLessonById>>>,
): void {
	// Refresh insertion order for LRU eviction (Map iterates oldest-first).
	if (lessonCache.has(lessonId)) {
		lessonCache.delete(lessonId);
	}

	lessonCache.set(lessonId, entry);

	while (lessonCache.size > PUBLISHED_LESSON_CACHE_MAX_ENTRIES) {
		const oldestKey = lessonCache.keys().next().value;
		if (oldestKey === undefined) {
			break;
		}
		lessonCache.delete(oldestKey);
	}
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
	bumpPublishedContentCacheGeneration();
	lessonCache.clear();
	curriculumCache = null;
}

/** @internal exposed for capacity / race tests */
export function getPublishedLessonCacheSizeForTests(): number {
	return lessonCache.size;
}

export async function getCachedPublishedLessonById(lessonId: string) {
	const now = Date.now();
	const generationAtStart = getPublishedContentCacheGeneration();
	const cached = lessonCache.get(lessonId);
	if (isFresh(cached, now, generationAtStart)) {
		// Touch for LRU: move to most-recently-used position.
		setLessonCacheEntry(lessonId, cached);
		return cached.value;
	}

	const value = await loadPublishedLessonById(lessonId);

	// Do not cache misses — forged / unknown IDs must not occupy the Map.
	if (value == null) {
		return value;
	}

	// Drop write-back if a write invalidated the cache while we were reading.
	if (getPublishedContentCacheGeneration() !== generationAtStart) {
		return value;
	}

	setLessonCacheEntry(lessonId, {
		value,
		expiresAt: now + PUBLISHED_CONTENT_CACHE_TTL_MS,
		generation: generationAtStart,
	});
	return value;
}

export async function getCachedPublishedCurriculum() {
	const now = Date.now();
	const generationAtStart = getPublishedContentCacheGeneration();
	if (isFresh(curriculumCache, now, generationAtStart)) {
		return curriculumCache.value;
	}

	const value = await loadPublishedCurriculum();

	if (getPublishedContentCacheGeneration() !== generationAtStart) {
		return value;
	}

	curriculumCache = {
		value,
		expiresAt: now + PUBLISHED_CONTENT_CACHE_TTL_MS,
		generation: generationAtStart,
	};
	return value;
}
