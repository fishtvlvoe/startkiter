import { BUNNY_API_KEY_FIELD, uploadVideoToBunny } from "@startkiter/platform";
import { NextResponse } from "next/server";

const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

export async function POST(request: Request) {
	const formData = await request.formData();
	const file = formData.get("file");
	if (!(file instanceof File)) return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });

	const apiKey = process.env.BUNNY_API_KEY?.trim() || process.env[BUNNY_API_KEY_FIELD]?.trim();
	const libraryId = process.env.BUNNY_LIBRARY_ID?.trim();
	if (!apiKey || !libraryId) return NextResponse.json({ error: "BUNNY_CONFIG_MISSING" }, { status: 503 });

	try {
		const result = await uploadVideoToBunny(file, { apiKey, libraryId, maxFileSizeBytes: MAX_VIDEO_SIZE_BYTES });
		return NextResponse.json(result);
	} catch (error) {
		const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
		return NextResponse.json({ error: code }, { status: code === "FILE_TOO_LARGE" ? 413 : 502 });
	}
}
