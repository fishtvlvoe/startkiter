import type { BetterAuthOptions } from "better-auth";

export type AuthEnvironment = Record<string, string | undefined>;

type LineProfile = {
	sub?: string;
	userId?: string;
	name?: string;
};

export function mapLineProfileToUser(profile: LineProfile) {
	const accountId = profile.sub ?? profile.userId;
	if (!accountId) {
		throw new Error("LINE profile is missing userId");
	}

	return {
		email: `line-${accountId.toLowerCase()}@accounts.startkiter.invalid`,
	};
}

export function getSocialProviders(
	env: AuthEnvironment,
): NonNullable<BetterAuthOptions["socialProviders"]> {
	const providers: NonNullable<BetterAuthOptions["socialProviders"]> = {};
	const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
	const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
	const lineChannelId = env.LINE_CHANNEL_ID?.trim();
	const lineChannelSecret = env.LINE_CHANNEL_SECRET?.trim();

	if (googleClientId && googleClientSecret) {
		providers.google = {
			clientId: googleClientId,
			clientSecret: googleClientSecret,
			scope: ["email", "profile"],
		};
	}

	if (lineChannelId && lineChannelSecret) {
		providers.line = {
			clientId: lineChannelId,
			clientSecret: lineChannelSecret,
			scope: ["openid", "profile", "email"],
			mapProfileToUser: mapLineProfileToUser,
		};
	}

	const githubClientId = env.GITHUB_CLIENT_ID?.trim();
	const githubClientSecret = env.GITHUB_CLIENT_SECRET?.trim();
	if (githubClientId && githubClientSecret) {
		providers.github = {
			clientId: githubClientId,
			clientSecret: githubClientSecret,
			scope: ["read:user", "user:email"],
		};
	}

	return providers;
}
