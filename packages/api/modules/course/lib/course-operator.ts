export function isCourseOperator(
	email: string | null | undefined,
	adminEmail: string | null | undefined,
): boolean {
	const sessionEmail = email?.trim().toLowerCase();
	const configuredEmail = adminEmail?.trim().toLowerCase();

	return Boolean(sessionEmail && configuredEmail && sessionEmail === configuredEmail);
}
