import { ORPCError, os } from "@orpc/server";
import { auth } from "@startkiter/auth";
import { createPermissionRules } from "@startkiter/permissions";

import { permix } from "./permix";

/** Minimal shape callers preload for `preloadedAuth`; matches better-auth's session user at the fields procedures rely on. */
export type PreloadedSessionUser = { id: string } & Record<string, unknown>;

export type ProcedureAuthContext = {
	headers: Headers;
	rawBody?: string;
	url?: string;
	/** When true, middleware trusts caller-provided session/user and skips getSession. */
	preloadedAuth?: boolean;
	session?: unknown;
	user?: PreloadedSessionUser | null;
	/** Request-scoped course access decisions keyed by courseId (server context only). */
	verifiedCourseAccessById?: Record<string, boolean>;
};

export const publicProcedure = os.$context<ProcedureAuthContext>();

export const publicProcedureWithSession = publicProcedure.use(async ({ context, next }) => {
	if (context.preloadedAuth) {
		return await next({
			context: {
				session: context.session ?? null,
				user: context.user ?? null,
				verifiedCourseAccessById: context.verifiedCourseAccessById,
			},
		});
	}

	const session = await auth.api.getSession({
		headers: context.headers,
	});

	return await next({
		context: {
			session: session?.session || null,
			user: session?.user || null,
			verifiedCourseAccessById: context.verifiedCourseAccessById,
		},
	});
});

export const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
	const session = await auth.api.getSession({
		headers: context.headers,
	});

	if (!session) {
		throw new ORPCError("UNAUTHORIZED");
	}

	// Setup with the user only. Org-scoped checks resolve membership for the
	// target organizationId via checkPermission / membership helpers — not the
	// session active org (which is often a different org than the procedure input).
	return await next({
		context: {
			session: session.session,
			user: session.user,
			...permix.setupContext(
				createPermissionRules({
					user: session.user,
				}),
			),
		},
	});
});

export const adminProcedure = protectedProcedure.use(permix.checkMiddleware("admin.access"));
