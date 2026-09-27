import {
	getCachedPublishedCourse,
	type PublicChapter,
	type PublicCourse,
	type PublicLesson,
} from "@startkiter/api/modules/course/lib/published-content-cache";
import { config } from "@config";

export type { PublicChapter, PublicCourse, PublicLesson };

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
	try {
		const cached = await getCachedPublishedCourse();
		if (cached) {
			return cached;
		}
	} catch {
		// Fallback to RPC fetch if direct DB/cache is unavailable
	}

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
