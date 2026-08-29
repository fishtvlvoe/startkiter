export const DEFAULT_MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
const BUNNY_API_BASE_URL = "https://video.bunnycdn.com";

export type BunnyUploadConfig = {
	apiKey: string;
	libraryId: string;
	fetchImpl?: typeof fetch;
	maxFileSizeBytes?: number;
};

export type BunnyUploadResult = { bunnyVideoId: string; duration: number };

export async function uploadVideoToBunny(file: File, config: BunnyUploadConfig): Promise<BunnyUploadResult> {
	const maxFileSizeBytes = config.maxFileSizeBytes ?? DEFAULT_MAX_VIDEO_SIZE_BYTES;
	if (file.size > maxFileSizeBytes) {
		throw new Error("FILE_TOO_LARGE");
	}

	const fetchImpl = config.fetchImpl ?? fetch;
	const headers = { AccessKey: config.apiKey, Accept: "application/json" };
	const createResponse = await fetchImpl(`${BUNNY_API_BASE_URL}/library/${config.libraryId}/videos`, {
		method: "POST",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({ title: file.name }),
	});
	if (!createResponse.ok) throw new Error("BUNNY_CREATE_FAILED");
	const created = (await createResponse.json()) as { guid?: unknown };
	if (typeof created.guid !== "string" || !created.guid) throw new Error("BUNNY_CREATE_INVALID_RESPONSE");

	const uploadResponse = await fetchImpl(`${BUNNY_API_BASE_URL}/library/${config.libraryId}/videos/${created.guid}`, {
		method: "PUT",
		headers: { ...headers, "Content-Type": file.type || "application/octet-stream" },
		body: await file.arrayBuffer(),
	});
	if (!uploadResponse.ok) throw new Error("BUNNY_UPLOAD_FAILED");
	const uploaded = (await uploadResponse.json()) as { length?: unknown };
	return { bunnyVideoId: created.guid, duration: typeof uploaded.length === "number" ? uploaded.length : 0 };
}

export type VideoUploadInput = { lessonId: string; file: File };
export type VideoUploadOutcome =
	| ({ lessonId: string; ok: true } & BunnyUploadResult)
	| { lessonId: string; ok: false; error: string };

export async function processVideoUploads(
	inputs: VideoUploadInput[],
	config: BunnyUploadConfig,
): Promise<VideoUploadOutcome[]> {
	const outcomes: VideoUploadOutcome[] = [];
	for (const input of inputs) {
		try {
			outcomes.push({ lessonId: input.lessonId, ok: true, ...(await uploadVideoToBunny(input.file, config)) });
		} catch (error) {
			outcomes.push({ lessonId: input.lessonId, ok: false, error: error instanceof Error ? error.message : "UPLOAD_FAILED" });
		}
	}
	return outcomes;
}
