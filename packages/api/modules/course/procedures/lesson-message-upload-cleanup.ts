import { db } from "@startkiter/database";

import { deleteLessonMessageUploadObject } from "./lesson-message-upload";

export async function cleanupExpiredLessonMessageUploadIntents(limit = 100): Promise<{ removed: number; failed: number; inspected: number }> {
	const expired = await db.lessonMessageUploadIntent.findMany({
		where: { status: "PENDING", expiresAt: { lte: new Date() } },
		orderBy: { expiresAt: "asc" },
		take: Math.max(1, Math.min(limit, 500)),
		select: { id: true, storageKey: true },
	});
	let removed = 0;
	let failed = 0;
	for (const intent of expired) {
		try {
			await deleteLessonMessageUploadObject(intent.storageKey);
			const deleted = await db.lessonMessageUploadIntent.deleteMany({ where: { id: intent.id, status: "PENDING" } });
			removed += deleted.count;
		} catch {
			failed += 1;
		}
	}
	return { removed, failed, inspected: expired.length };
}
