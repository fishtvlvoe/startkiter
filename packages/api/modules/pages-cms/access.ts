export type PagesCmsSession = {
	user?: {
		id?: string | null;
		email?: string | null;
		role?: string | null;
	};
} | null;

function emailsMatch(
	email: string | null | undefined,
	adminEmail: string | null | undefined,
): boolean {
	const sessionEmail = email?.trim().toLowerCase();
	const configuredEmail = adminEmail?.trim().toLowerCase();
	return Boolean(sessionEmail && configuredEmail && sessionEmail === configuredEmail);
}

/**
 * pages-cms 唯一授權來源：只比對 session email 與 ADMIN_EMAIL。
 * 不看 user.role，避免後台 layout 與 API 各用一套判斷。
 */
export function resolvePagesCmsAccess(
	session: PagesCmsSession,
	adminEmail: string | null | undefined = process.env.ADMIN_EMAIL,
): 401 | 403 | null {
	if (!session?.user?.id) {
		return 401;
	}
	if (!emailsMatch(session.user.email, adminEmail)) {
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
