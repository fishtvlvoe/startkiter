export function getBaseUrl(value = process.env.BETTER_AUTH_URL) {
	return value?.trim() || "http://localhost:3000";
}

export function isNonEmpty(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}
