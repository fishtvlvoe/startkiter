import { createDatabase } from "@startkiter/database";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { getSocialProviders, type AuthEnvironment } from "./providers";

export type { AuthEnvironment } from "./providers";

const MIN_SECRET_LENGTH = 32;

export type AuthSession = {
	session: { userId: string };
	user: { id: string; name: string; email: string; image?: string | null };
};

export type AuthInstance = {
	handler: (request: Request) => Promise<Response>;
	api: {
		getSession: (input: { headers: Headers }) => Promise<AuthSession | null>;
	};
	enabledProviders: { google: boolean; line: boolean; github: boolean };
};

type AuthFactoryOptions = {
	env?: AuthEnvironment;
	database?: BetterAuthOptions["database"];
};

function getValue(env: AuthEnvironment, key: string) {
	return env[key]?.trim();
}

function failClosed(
	reason: string,
	enabledProviders = { google: false, line: false, github: false },
): AuthInstance {
	const response = () =>
		new Response(JSON.stringify({ error: "AUTH_NOT_CONFIGURED", message: reason }), {
			status: 503,
			headers: { "content-type": "application/json" },
		});

	return {
		handler: async () => response(),
		api: { getSession: async () => null },
		enabledProviders,
	};
}

export function createAuth(options: AuthFactoryOptions = {}): AuthInstance {
	const env = options.env ?? process.env;
	const databaseUrl = getValue(env, "DATABASE_URL");
	const secret = getValue(env, "BETTER_AUTH_SECRET");
	const baseURL = getValue(env, "BETTER_AUTH_URL") || "http://localhost:3000";
	const socialProviders = getSocialProviders(env);
	const enabledProviders = {
		google: Boolean(socialProviders.google),
		line: Boolean(socialProviders.line),
		github: Boolean(socialProviders.github),
	};

	if (!databaseUrl) {
		return failClosed("DATABASE_URL is not configured");
	}
	if (!secret || secret.length < MIN_SECRET_LENGTH) {
		return failClosed(
			`BETTER_AUTH_SECRET must contain at least ${MIN_SECRET_LENGTH} characters`,
		);
	}

	const database =
		options.database ??
		prismaAdapter(createDatabase(databaseUrl), {
			provider: "postgresql",
		});

	const auth = betterAuth({
		baseURL,
		trustedOrigins: [baseURL],
		secret,
		database,
		advanced: {
			database: { generateId: options.database ? "uuid" : false },
		},
		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ["google", "line", "github"],
				// LINE 用 synthetic email；綁 GitHub 幾乎一定不同 email，需允許（僅 link-social 需既有 session）
				allowDifferentEmails: true,
			},
		},
		emailAndPassword: {
			enabled: true,
			autoSignIn: false,
			minPasswordLength: 8,
		},
		socialProviders,
	});

	return {
		handler: (request) => auth.handler(request),
		api: {
			getSession: (input) => auth.api.getSession(input) as Promise<AuthSession | null>,
		},
		enabledProviders,
	};
}
