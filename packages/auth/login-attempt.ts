import { db } from "@startkiter/database";
import { logger } from "@startkiter/logs";

/**
 * Best-effort audit write. Login must not fail because the audit database is unavailable.
 */
export function recordLoginAttempt(
	email: string,
	ipAddress: string,
	success: boolean,
	userAgent?: string,
): void {
	void db.loginAttempt
		.create({
			data: {
				email,
				ipAddress,
				success,
				userAgent,
			},
		})
		.catch((error: unknown) => {
			logger.error(error, { ctx: "recordLoginAttempt" });
		});
}
