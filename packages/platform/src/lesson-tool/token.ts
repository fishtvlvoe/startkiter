import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "lesson-tool-embed-v1";
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_TOKEN_LENGTH = 4096;

function localSecret(): string {
	if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
		throw new Error("Missing BETTER_AUTH_SECRET");
	}
	return process.env.BETTER_AUTH_SECRET ?? "startkiter-local-lesson-tool-embed-secret";
}

function sign(payload: string): string {
	return createHmac("sha256", localSecret()).update(payload).digest("base64url");
}

export function signLessonToolToken(lessonId: string, userId: string): string {
	const payload = Buffer.from(
		JSON.stringify({
			v: TOKEN_VERSION,
			lessonId,
			userId,
			expiresAt: Date.now() + TOKEN_TTL_MS,
			nonce: randomUUID(),
		}),
		"utf8",
	).toString("base64url");
	return `${payload}.${sign(payload)}`;
}

export function verifyLessonToolToken(token: string, lessonId: string, userId: string): boolean {
	if (token.length > MAX_TOKEN_LENGTH) return false;
	const [payload, signature] = token.split(".");
	if (!payload || !signature || signature.length !== 43 || !/^[A-Za-z0-9_-]+$/.test(signature)) return false;

	const actual = Buffer.from(signature);
	const expected = Buffer.from(sign(payload));
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

	try {
		const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
		if (
			parsed.v !== TOKEN_VERSION ||
			typeof parsed.lessonId !== "string" ||
			typeof parsed.userId !== "string" ||
			parsed.lessonId !== lessonId ||
			parsed.userId !== userId ||
			typeof parsed.expiresAt !== "number" ||
			parsed.expiresAt < Date.now()
		) {
			return false;
		}
		return true;
	} catch {
		return false;
	}
}
