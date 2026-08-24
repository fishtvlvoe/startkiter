import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";

export function isCourseOperator(
	email: string | null | undefined,
	adminEmail: string | null | undefined,
): boolean {
	const sessionEmail = email?.trim().toLowerCase();
	const configuredEmail = adminEmail?.trim().toLowerCase();

	return Boolean(sessionEmail && configuredEmail && sessionEmail === configuredEmail);
}

export const courseOperatorProcedure = protectedProcedure.use(async ({ context, next }) => {
	if (!isCourseOperator(context.user.email, process.env.ADMIN_EMAIL)) {
		throw new ORPCError("FORBIDDEN");
	}

	return next();
});
