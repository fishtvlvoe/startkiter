import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";
import { isCourseOperator } from "./course-operator";

export const courseInviteOperatorProcedure = protectedProcedure.use(async ({ context, next }) => {
	if (!isCourseOperator(context.user.email, process.env.ADMIN_EMAIL)) {
		throw new ORPCError("FORBIDDEN");
	}

	return next();
});

export function normalizeInviteEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function isInviteExpired(expiresAt: Date | null, now = new Date()): boolean {
	return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}
