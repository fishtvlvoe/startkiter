import { checkPermission } from "./check-permission";

export type OperatorUser = {
	email?: string | null;
	role?: string | null;
};

export type OperatorSession = {
	user: {
		id: string;
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
 * Unified operator check: role=admin OR email matches ADMIN_EMAIL.
 * Fail-closed for null/undefined user and blank ADMIN_EMAIL (unless role is admin).
 */
export function isOperator(
	user: OperatorUser | null | undefined,
	adminEmail: string | null | undefined = process.env.ADMIN_EMAIL,
): boolean {
	if (!user) {
		return false;
	}
	if (checkPermission({ user }, "admin.access")) {
		return true;
	}
	return emailsMatch(user.email, adminEmail);
}

export function operatorHttpStatus(
	session: OperatorSession,
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
