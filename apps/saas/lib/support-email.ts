export function resolveSupportEmail(env: NodeJS.Dict<string | undefined> = process.env) {
	return env.SUPPORT_EMAIL?.trim() || env.EMAIL_FROM?.trim() || null;
}
