import { config } from "@config";

export type PublicLesson = {
	id: string;
	slug: string;
	title: string;
	isFreePreview: boolean;
	videoDuration: string | null;
	order: number;
	chapterId: string;
};

export type PublicChapter = {
	id: string;
	title: string;
	order: number;
	lessons: PublicLesson[];
};

export type PublicCourse = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	chapters: PublicChapter[];
};

function unwrapRpcPayload(payload: unknown): unknown {
	if (typeof payload !== "object" || payload === null) {
		return payload;
	}

	const record = payload as Record<string, unknown>;

	if ("json" in record) {
		return record.json;
	}

	return payload;
}

export async function fetchPublishedCourse(): Promise<PublicCourse | null> {
	const saasUrl = config.saasUrl?.replace(/\/$/, "");

	if (!saasUrl) {
		return null;
	}

	try {
		const response = await fetch(`${saasUrl}/api/rpc/course/getPublicCurriculum`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({}),
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const payload = unwrapRpcPayload(await response.json()) as {
			course?: PublicCourse | null;
		};

		return payload.course ?? null;
	} catch {
		return null;
	}
}
