export type CourseOperatorUser = {
	email?: string | null;
	role?: string | null;
};

function configuredOperatorEmails() {
	return new Set(
		(process.env.ADMIN_EMAIL ?? "")
			.split(/[\s,;]+/)
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean),
	);
}

/**
 * Course Studio has a smaller allowlist than a generic organization role.
 * Identity always comes from the server session, never from a request body.
 */
export function isCourseOperator(user: CourseOperatorUser | null | undefined) {
	if (!user) {
		return false;
	}

	const role = user.role?.trim().toLowerCase();
	if (role === "admin" || role === "operator") {
		return true;
	}

	const email = user.email?.trim().toLowerCase();
	return Boolean(email && configuredOperatorEmails().has(email));
}
