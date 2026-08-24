import { cleanupExpiredLessonMessageUploadIntents } from "@startkiter/api/modules/course/procedures/lesson-message-upload-cleanup";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

function hasValidCleanupSecret(request: Request): boolean {
	const configuredSecret = process.env.LESSON_MESSAGE_UPLOAD_CLEANUP_SECRET;
	if (!configuredSecret) return false;
	const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
	const suppliedBuffer = Buffer.from(supplied);
	const configuredBuffer = Buffer.from(configuredSecret);
	return suppliedBuffer.length === configuredBuffer.length && timingSafeEqual(suppliedBuffer, configuredBuffer);
}

export async function POST(request: Request) {
	if (!hasValidCleanupSecret(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
	const result = await cleanupExpiredLessonMessageUploadIntents();
	return Response.json({ ok: true, ...result });
}
