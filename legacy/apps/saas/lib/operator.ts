export function isOperator(
	email: string | null | undefined,
	adminEmail: string | null | undefined,
): boolean {
	const sessionEmail = email?.trim().toLowerCase();
	const configured = adminEmail?.trim().toLowerCase();
	if (!sessionEmail || !configured) {
		return false;
	}
	return sessionEmail === configured;
}

export type OperatorSession = {
	user: {
		id: string;
		email?: string | null;
	};
} | null;

export function operatorHttpStatus(
	session: OperatorSession,
	adminEmail: string | null | undefined,
): 401 | 403 | null {
	if (!session?.user?.id) {
		return 401;
	}
	if (!isOperator(session.user.email, adminEmail)) {
		return 403;
	}
	return null;
}

export function shouldShowOperatorSettingsLink(
	signedIn: boolean,
	email: string | null | undefined,
	adminEmail: string | null | undefined,
): boolean {
	return signedIn && isOperator(email, adminEmail);
}
