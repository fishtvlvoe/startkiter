import { db, type Prisma } from "@startkiter/database";

export type AdminLogTarget = {
	type: string;
	id: string;
};

/**
 * Best-effort audit write. An audit outage must not roll back the operator action.
 */
export async function recordAdminAction(
	adminId: string,
	action: string,
	target: AdminLogTarget,
	details?: Record<string, unknown>,
	ipAddress?: string,
): Promise<void> {
	try {
		await db.adminLog.create({
			data: {
				adminId,
				action,
				targetType: target.type,
				targetId: target.id,
				details: details as Prisma.InputJsonValue | undefined,
				ipAddress,
			},
		});
	} catch (error) {
		console.error("[audit] recordAdminAction failed", error);
	}
}

export function getClientIp(headers: Headers): string | undefined {
	return (
		headers.get("cf-connecting-ip")?.trim() ||
		headers.get("x-real-ip")?.trim() ||
		headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
		undefined
	);
}
