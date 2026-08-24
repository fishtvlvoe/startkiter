import { db } from "@startkiter/database";

import { deleteLessonMessageUploadObject } from "./lesson-message-upload";

const EXPIRY_GRACE_MS = 5 * 60_000;
const CLAIM_RETRY_MS = 10 * 60_000;
const FINALIZED_RETENTION_MS = 7 * 24 * 60 * 60_000;

export async function cleanupExpiredLessonMessageUploadIntents(limit = 100): Promise<{ removed: number; failed: number; inspected: number }> {
	const boundedLimit = Math.max(1, Math.min(limit, 500));
	const now = Date.now();
	const expiryCutoff = new Date(now - EXPIRY_GRACE_MS);
	const staleClaimCutoff = new Date(now - CLAIM_RETRY_MS);
	const expired = await db.lessonMessageUploadIntent.findMany({
		where: {
			expiresAt: { lte: expiryCutoff },
			OR: [
				{ status: "PENDING" },
				{ status: "CLEANING", OR: [{ cleanupClaimedAt: null }, { cleanupClaimedAt: { lt: staleClaimCutoff } }] },
			],
		},
		orderBy: { expiresAt: "asc" },
		take: boundedLimit,
		select: { id: true, storageKey: true },
	});
	let removed = 0;
	let failed = 0;
	for (const intent of expired) {
		const claimTime = new Date();
		const claimed = await db.lessonMessageUploadIntent.updateMany({
			where: { id: intent.id, status: "PENDING", expiresAt: { lte: expiryCutoff } },
			data: { status: "CLEANING", cleanupClaimedAt: claimTime },
		});
		const reclaimed = claimed.count === 1 ? claimed : await db.lessonMessageUploadIntent.updateMany({
			where: {
				id: intent.id,
				status: "CLEANING",
				expiresAt: { lte: expiryCutoff },
				OR: [{ cleanupClaimedAt: null }, { cleanupClaimedAt: { lt: staleClaimCutoff } }],
			},
			data: { cleanupClaimedAt: claimTime },
		});
		if (reclaimed.count !== 1) {
			const current = await db.lessonMessageUploadIntent.findUnique({ where: { id: intent.id }, select: { status: true } }).catch(() => null);
			if (!current) {
				try {
					await deleteLessonMessageUploadObject(intent.storageKey);
				} catch {
					failed += 1;
				}
			}
			continue;
		}
		try {
			await deleteLessonMessageUploadObject(intent.storageKey);
			const deleted = await db.lessonMessageUploadIntent.deleteMany({ where: { id: intent.id, status: "CLEANING", cleanupClaimedAt: claimTime } });
			removed += deleted.count;
		} catch {
			failed += 1;
			await db.lessonMessageUploadIntent.updateMany({
				where: { id: intent.id, status: "CLEANING", cleanupClaimedAt: claimTime },
				data: { status: "PENDING", cleanupClaimedAt: null },
			}).catch(() => undefined);
		}
	}

	const finalized = await db.lessonMessageUploadIntent.findMany({
		where: { status: "FINALIZED", createdAt: { lte: new Date(now - FINALIZED_RETENTION_MS) } },
		take: boundedLimit,
		select: { id: true },
	});
	if (finalized.length > 0) {
		const deleted = await db.lessonMessageUploadIntent.deleteMany({ where: { id: { in: finalized.map(({ id }) => id) }, status: "FINALIZED" } });
		removed += deleted.count;
	}
	return { removed, failed, inspected: expired.length + finalized.length };
}
