import { isOperator } from "@startkiter/permissions";

export type PagesCmsSession = {
	user?: {
		id?: string | null;
		email?: string | null;
		role?: string | null;
	};
} | null;

/**
 * pages-cms 唯一授權來源：共用 isOperator（role=admin OR ADMIN_EMAIL）。
 */
export function resolvePagesCmsAccess(
	session: PagesCmsSession,
	adminEmail: string | null | undefined = process.env.ADMIN_EMAIL,
): 401 | 403 | null {
	if (!session?.user?.id) {
		return 401;
	}
	if (!isOperator(session.user, adminEmail)) {
		return 403;
	}
	return null;
}

export function canAccessPagesCmsAdmin(
	session: PagesCmsSession,
	adminEmail: string | null | undefined = process.env.ADMIN_EMAIL,
): boolean {
	return resolvePagesCmsAccess(session, adminEmail) === null;
}
