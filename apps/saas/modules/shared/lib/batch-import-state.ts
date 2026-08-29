export type BatchLessonStatus = "pending" | "uploading" | "generating" | "completed" | "error";

export type BatchLessonState = {
	id: string;
	status: BatchLessonStatus;
	error?: string;
};

export function formatImportFailures(failures: readonly { chapterTitle?: string; lessonTitle: string; error?: string }[]): string {
	return `${failures.length} 個單元建立失敗：${failures.map((failure) => failure.lessonTitle).join("、")}`;
}

export async function retryFailedLesson(
	states: readonly BatchLessonState[],
	lessonId: string,
	processLesson: (lessonId: string) => Promise<Pick<BatchLessonState, "status" | "error">>,
): Promise<BatchLessonState[]> {
	const target = states.find((lesson) => lesson.id === lessonId);
	if (!target || target.status !== "error") return [...states];
	const next = await processLesson(lessonId);
	return states.map((lesson) => {
		if (lesson.id !== lessonId) return { ...lesson };
		const updated = { ...lesson, ...next };
		if (next.error === undefined) delete updated.error;
		return updated;
	});
}
