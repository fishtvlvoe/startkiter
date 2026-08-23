export type ReorderLessonItem = {
	id: string;
};

export type ReorderChapter<TLesson extends ReorderLessonItem> = {
	id: string;
	lessons: TLesson[];
};

export type ReorderMove = {
	lessonId: string;
	chapterId: string;
	order: number;
};

export type ReorderPayload = {
	moves: ReorderMove[];
};

export function buildLessonReorder<
	TLesson extends ReorderLessonItem,
	TChapter extends ReorderChapter<TLesson>,
>(
	chapters: readonly TChapter[],
	lessonId: string,
	targetChapterId: string,
	targetIndex: number,
) {
	const originalLocations = new Map(
		chapters.flatMap((chapter) =>
			chapter.lessons.map((lesson, order) => [lesson.id, { chapterId: chapter.id, order }]),
		),
	);
	const nextChapters = chapters.map((chapter) => ({ ...chapter, lessons: [...chapter.lessons] })) as TChapter[];
	const sourceChapter = nextChapters.find((chapter) => chapter.lessons.some((lesson) => lesson.id === lessonId));
	const targetChapter = nextChapters.find((chapter) => chapter.id === targetChapterId);
	if (!sourceChapter || !targetChapter) {
		return { chapters: nextChapters, payload: { moves: [] } satisfies ReorderPayload };
	}

	const sourceIndex = sourceChapter.lessons.findIndex((lesson) => lesson.id === lessonId);
	const [lesson] = sourceChapter.lessons.splice(sourceIndex, 1);
	if (!lesson) {
		return { chapters: nextChapters, payload: { moves: [] } satisfies ReorderPayload };
	}

	const boundedIndex = Math.min(Math.max(targetIndex, 0), targetChapter.lessons.length);
	targetChapter.lessons.splice(boundedIndex, 0, lesson);

	const moves: ReorderMove[] = [];
	for (const chapter of nextChapters) {
		chapter.lessons.forEach((currentLesson, order) => {
			const previous = originalLocations.get(currentLesson.id);
			if (!previous || previous.chapterId !== chapter.id || previous.order !== order) {
				moves.push({ lessonId: currentLesson.id, chapterId: chapter.id, order });
			}
		});
	}

	return { chapters: nextChapters, payload: { moves } satisfies ReorderPayload };
}

export async function reorderLesson<
	TLesson extends ReorderLessonItem,
	TChapter extends ReorderChapter<TLesson>,
>(
	chapters: readonly TChapter[],
	lessonId: string,
	targetChapterId: string,
	targetIndex: number,
	persist: (payload: ReorderPayload) => Promise<{ ok: boolean }>,
) {
	const result = buildLessonReorder<TLesson, TChapter>(chapters, lessonId, targetChapterId, targetIndex);
	if (result.payload.moves.length > 0) {
		const persisted = await persist(result.payload);
		if (!persisted.ok) {
			throw new Error("單元排序持久化失敗。");
		}
	}
	return result.chapters;
}
