import { inspectMdxSource } from "@startkiter/course";
import { db, VideoProvider } from "@startkiter/database";

import { COURSE_STUDIO_ERROR_CODES } from "../errors";
import { resolveVideoSource } from "./video-resolver";

export type UpdateLessonInput = {
	id: string;
	title?: string;
	isFreePreview?: boolean;
	videoUrl?: string;
	videoDuration?: string;
	content?: string;
	aiPrompt?: string;
	aiContext?: string;
};

export async function updateLesson(input: UpdateLessonInput) {
	const { id, ...data } = input;

	if (typeof data.content === "string") {
		const inspection = inspectMdxSource(data.content);
		if (!inspection.ok) {
			return {
				ok: false as const,
				error: COURSE_STUDIO_ERROR_CODES.INVALID_MDX_CONTENT,
				details: inspection.error,
			};
		}
	}

	let videoProvider: VideoProvider | undefined;
	if (data.videoUrl) {
		const resolved = resolveVideoSource(data.videoUrl);
		if (resolved.ok) {
			videoProvider = resolved.provider as VideoProvider;
		}
	}

	const lesson = await db.lesson.update({
		where: { id },
		data: {
			...data,
			...(videoProvider ? { videoProvider } : {}),
		},
	});

	return { ok: true as const, lesson };
}
