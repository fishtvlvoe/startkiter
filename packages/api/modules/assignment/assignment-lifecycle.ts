import { db, type Prisma } from "@startkiter/database";
import { z } from "zod";

import { deleteAssignmentUploadObject } from "./assignment-upload";

const assignmentSubmissionCursorSchema = z.object({
	pluginContentId: z.string().trim().min(1).max(200),
	id: z.string().trim().min(1).max(200),
	submittedAt: z.string().datetime(),
	createdAt: z.string().datetime(),
});

export type AssignmentSubmissionCursor = z.infer<typeof assignmentSubmissionCursorSchema>;

export function encodeAssignmentSubmissionCursor(cursor: AssignmentSubmissionCursor): string {
	return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeAssignmentSubmissionCursor(value: string): AssignmentSubmissionCursor | null {
	try {
		const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
		const result = assignmentSubmissionCursorSchema.safeParse(parsed);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

type CleanupScope = { pluginContentId?: string; userId?: string };
const cleanupClaimLeaseMs = 5 * 60_000;
const cleanupUploadGraceMs = 5 * 60_000;

export async function cleanupExpiredAssignmentUploadIntents(
	scope: CleanupScope = {},
	limit = 100,
): Promise<{ removed: number; failed: number; inspected: number }> {
	const claimableBefore = new Date(Date.now() - cleanupClaimLeaseMs);
	const where: Prisma.AssignmentUploadIntentWhereInput = {
		// Keep expired intents for a grace period so a signed S3 PUT that started
		// before expiry cannot be deleted while the object store is still writing.
		expiresAt: { lte: new Date(Date.now() - cleanupUploadGraceMs) },
		OR: [
			{ status: { in: ["PENDING", "UPLOADED", "CANCELLED"] }, OR: [{ cleanupClaimedAt: null }, { cleanupClaimedAt: { lt: claimableBefore } }] },
			{ status: "CLEANING", OR: [{ cleanupClaimedAt: null }, { cleanupClaimedAt: { lt: claimableBefore } }] },
		],
		...(scope.pluginContentId ? { pluginContentId: scope.pluginContentId } : {}),
		...(scope.userId ? { userId: scope.userId } : {}),
	};
	const expired = await db.assignmentUploadIntent.findMany({
		where,
		orderBy: { expiresAt: "asc" },
		take: Math.max(1, Math.min(limit, 500)),
		select: { id: true, storageKey: true, status: true, cleanupClaimedAt: true },
	});
	let removed = 0;
	let failed = 0;

	for (const intent of expired) {
		const claimedAt = new Date();
		const claimed = await db.assignmentUploadIntent.updateMany({
			where: {
				id: intent.id,
				status: intent.status,
				OR: [{ cleanupClaimedAt: null }, { cleanupClaimedAt: { lt: claimableBefore } }],
			},
			data: { status: "CLEANING", cleanupClaimedAt: claimedAt },
		});
		if (claimed.count !== 1) continue;

		try {
			await deleteAssignmentUploadObject(intent.storageKey);
			const deleted = await db.assignmentUploadIntent.deleteMany({ where: { id: intent.id, status: "CLEANING", cleanupClaimedAt: claimedAt } });
			removed += deleted.count;
		} catch {
			failed += 1;
			await db.assignmentUploadIntent.updateMany({ where: { id: intent.id, status: "CLEANING", cleanupClaimedAt: claimedAt }, data: { status: intent.status, cleanupClaimedAt: null } });
		}
	}

	return { removed, failed, inspected: expired.length };
}
