import { passkey } from "@better-auth/passkey";
import {
	db,
	getInvitationById,
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
	getUserByEmail,
	getUserById,
} from "@startkiter/database";
import { config as i18nConfig, type Locale } from "@startkiter/i18n";
import { logger } from "@startkiter/logs";
import { sendEmail } from "@startkiter/mail";
import { createWelcomeNotification } from "@startkiter/notifications";
import { cancelSubscription } from "@startkiter/payments";
import { getBaseUrl } from "@startkiter/utils";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, getIp, isAPIError } from "better-auth/api";
import { admin, magicLink, openAPI, organization, twoFactor } from "better-auth/plugins";
import { adminAc, memberAc, ownerAc } from "better-auth/plugins/organization/access";
import { parseCookie as parseCookies } from "cookie";

import { config } from "./config";
import { updateSeatsInOrganizationSubscription } from "./lib/organization";
import { organizationRoleHooks } from "./lib/organization-role-hooks";
import { recordLoginAttempt } from "./login-attempt";
import { invitationOnlyPlugin } from "./plugins/invitation-only";
import { getSocialProviders } from "./providers";
import type { OrganizationMemberRole as OrganizationMemberRoleValue } from "./lib/organization-roles";

const getLocaleFromRequest = (request?: Request) => {
	const cookies = parseCookies(request?.headers.get("cookie") ?? "");
	return (cookies[i18nConfig.localeCookieName] as Locale) ?? i18nConfig.defaultLocale;
};

const appUrl = getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000);
const socialProviders = getSocialProviders(process.env);

export const auth = betterAuth({
	baseURL: appUrl,
	trustedOrigins: [appUrl],
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	advanced: {
		database: {
			generateId: false,
		},
	},
	session: {
		expiresIn: config.sessionCookieMaxAge,
		freshAge: 0,
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const user = await getUserById(session.userId);
					return {
						data: {
							...session,
							activeOrganizationId: user?.lastActiveOrganizationId ?? null,
						},
					};
				},
			},
		},
		user: {
			create: {
				after: async (createdUser) => {
					if (!createdUser?.id) {
						return;
					}
					try {
						await createWelcomeNotification(createdUser.id);
					} catch (error) {
						logger.error(error, {
							ctx: "createWelcomeNotification",
							userId: createdUser.id,
						});
					}
				},
			},
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "line", "github"],
			allowDifferentEmails: true,
		},
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/magic-link/verify")) {
				const request = ctx.request;
				if (!request) return;
				const body = ctx.body as { email?: unknown; loginHint?: unknown } | undefined;
				const query = ctx.query as { email?: unknown } | undefined;
				const returned = ctx.context.returned;
				const loginAuditContext = ctx.context as typeof ctx.context & { loginAttemptEmail?: string };
				const email =
					typeof body?.email === "string"
						? body.email
						: typeof body?.loginHint === "string"
							? body.loginHint
							: typeof query?.email === "string"
								? query.email
								: loginAuditContext.loginAttemptEmail ??
									(typeof returned === "object" && returned !== null && "user" in returned &&
									 typeof returned.user === "object" && returned.user !== null &&
									 "email" in returned.user && typeof returned.user.email === "string"
										? returned.user.email
										: "unknown");
				const isRedirectSuccess = isAPIError(returned) && returned.statusCode >= 300 && returned.statusCode < 400;
				recordLoginAttempt(
					email,
					getIp(request, ctx.context.options) ?? "unknown",
					!isAPIError(returned) || isRedirectSuccess,
					request.headers.get("user-agent") ?? undefined,
				);
			} else if (ctx.path.startsWith("/organization/accept-invitation")) {
				const { invitationId } = ctx.body;

				if (!invitationId) {
					return;
				}

				const invitation = await getInvitationById(invitationId);

				if (!invitation) {
					return;
				}

				await updateSeatsInOrganizationSubscription(invitation.organizationId);
			} else if (ctx.path.startsWith("/organization/remove-member")) {
				const { organizationId } = ctx.body;

				if (!organizationId) {
					return;
				}

				await updateSeatsInOrganizationSubscription(organizationId);
			}
		}),
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith("/magic-link/verify")) {
				const token = (ctx.query as { token?: unknown } | undefined)?.token;
				if (typeof token === "string") {
					try {
						const verification = await ctx.context.internalAdapter.findVerificationValue(token);
						if (verification?.value) {
							const value = JSON.parse(verification.value) as { email?: unknown };
							if (typeof value.email === "string") {
								(ctx.context as typeof ctx.context & { loginAttemptEmail?: string }).loginAttemptEmail = value.email;
							}
						}
					} catch {
						// Audit enrichment is best effort; a lookup failure must not block verification.
					}
				}
			}

			if (ctx.path.startsWith("/delete-user") || ctx.path.startsWith("/organization/delete")) {
				const userId = ctx.context.session?.session.userId;
				const { organizationId } = ctx.body;

				if (userId || organizationId) {
					const purchases = organizationId
						? await getPurchasesByOrganizationId(organizationId)
						: // oxlint-disable-next-line typescript/no-non-null-assertion -- This is a valid case
							await getPurchasesByUserId(userId!);
					const subscriptions = purchases.filter(
						(purchase) => purchase.type === "SUBSCRIPTION" && purchase.subscriptionId !== null,
					);

					if (subscriptions.length > 0) {
						for (const subscription of subscriptions) {
							await cancelSubscription(
								// oxlint-disable-next-line typescript/no-non-null-assertion -- This is a valid case
								subscription.subscriptionId!,
							);
						}
					}
				}
			}
		}),
	},
	user: {
		additionalFields: {
			onboardingComplete: {
				type: "boolean",
				required: false,
			},
			locale: {
				type: "string",
				required: false,
			},
			lastActiveOrganizationId: {
				type: "string",
				required: false,
			},
		},
		deleteUser: {
			enabled: true,
		},
		changeEmail: {
			enabled: true,
			sendChangeEmailConfirmation: async ({ user: { email, name }, url }, request) => {
				const locale = getLocaleFromRequest(request);
				await sendEmail({
					to: email,
					templateId: "emailVerification",
					context: {
						url,
						name,
					},
					locale,
				});
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		// If signup is disabled, the only way to sign up is via an invitation. So in this case we can auto sign in the user, as the email is already verified by the invitation.
		// If signup is enabled, we can't auto sign in the user, as the email is not verified yet.
		autoSignIn: !config.enableSignup,
		requireEmailVerification: config.enableSignup,
		sendResetPassword: async ({ user, url }, request) => {
			const locale = getLocaleFromRequest(request);
			await sendEmail({
				to: user.email,
				templateId: "forgotPassword",
				context: {
					url,
					name: user.name,
				},
				locale,
			});
		},
		minPasswordLength: 8,
	},
	emailVerification: {
		sendOnSignUp: config.enableSignup,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user: { email, name }, url }, request) => {
			const locale = getLocaleFromRequest(request);
			await sendEmail({
				to: email,
				templateId: "emailVerification",
				context: {
					url,
					name,
				},
				locale,
			});
		},
	},
	socialProviders,
	plugins: [
		admin(),
		passkey(),
		magicLink({
			disableSignUp: false,
			sendMagicLink: async ({ email, url }, ctx) => {
				const request = ctx?.request as Request;

				const locale = getLocaleFromRequest(request);
				await sendEmail({
					to: email,
					templateId: "magicLink",
					context: {
						url,
					},
					locale,
				});
			},
		}),
		organization({
			creatorRole: "owner",
			roles: {
				owner: ownerAc,
				admin: adminAc,
				instructor: memberAc,
				user: memberAc,
			},
			organizationHooks: organizationRoleHooks,
			sendInvitationEmail: async ({ email, id, organization }, request) => {
				const locale = getLocaleFromRequest(request);
				const existingUser = await getUserByEmail(email);

				const url = new URL(
					existingUser ? "/login" : "/signup",
					getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000),
				);

				url.searchParams.set("invitationId", id);
				url.searchParams.set("email", email);

				await sendEmail({
					to: email,
					templateId: "organizationInvitation",
					locale,
					context: {
						organizationName: organization.name,
						url: url.toString(),
					},
				});
			},
		}),
		openAPI(),
		invitationOnlyPlugin(),
		twoFactor(),
	],
	onAPIError: {
		onError(error, ctx) {
			logger.error(error, { ctx });
		},
	},
});

export * from "./lib/organization";

export type Session = typeof auth.$Infer.Session;

export type ActiveOrganization = NonNullable<
	Awaited<ReturnType<typeof auth.api.getFullOrganization>>
>;

export type Organization = typeof auth.$Infer.Organization;

export type OrganizationMemberRole = OrganizationMemberRoleValue;

export type OrganizationInvitationStatus = typeof auth.$Infer.Invitation.status;

export type OrganizationMetadata = Record<string, unknown> | undefined;
