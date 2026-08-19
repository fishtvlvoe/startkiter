import { config } from "@config";
import type { FluentVideoSource } from "@startkiter/course";

export type AcademyLesson = {
	content: string | null;
	id: string;
	isFreePreview: boolean;
	title: string;
	videoDuration: string | null;
	videoSource: FluentVideoSource;
};

export type AcademyCatalog = {
	chapters: Array<{
		id: string;
		lessons: Array<{
			id: string;
			isFreePreview: boolean;
			slug: string;
			title: string;
			videoDuration: string | null;
		}>;
		title: string;
	}>;
	course: { description: string | null; id: string; slug: string; title: string } | null;
};

function courseApiUrl(path: string) {
	if (!config.saasUrl) {
		return null;
	}
	return new URL(path, config.saasUrl).toString();
}

export async function getAcademyCatalog(): Promise<AcademyCatalog | null> {
	const url = courseApiUrl("/api/course/lessons");
	if (!url) {
		return null;
	}
	try {
		const response = await fetch(url, { cache: "no-store" });
		if (!response.ok) {
			return null;
		}
		return (await response.json()) as AcademyCatalog;
	} catch {
		return null;
	}
}

export async function getAcademyPreview(lessonId: string): Promise<AcademyLesson | null> {
	const url = courseApiUrl("/api/course/lessons");
	if (!url) {
		return null;
	}
	try {
		const response = await fetch(url, {
			body: JSON.stringify({ lessonId }),
			cache: "no-store",
			headers: { "content-type": "application/json" },
			method: "POST",
		});
		if (!response.ok) {
			return null;
		}
		const body = (await response.json()) as { lesson?: AcademyLesson };
		return body.lesson ?? null;
	} catch {
		return null;
	}
}
