export { courseOperatorProcedure as courseInviteOperatorProcedure } from "./course-operator";

export function normalizeInviteEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function isInviteExpired(expiresAt: Date | null, now = new Date()): boolean {
	return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}
