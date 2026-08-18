import type { LessonSummary } from "@startkiter/course";

type Translate = (key: string) => string;

export function localizeLesson<T extends LessonSummary>(lesson: T, t: Translate) {
	return {
		...lesson,
		title: t(`lessons.${lesson.id}.title`),
		description: t(`lessons.${lesson.id}.description`),
	};
}
