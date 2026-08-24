import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const quizStartPayloadSchema = z.object({
	userId: z.string().min(1),
	pluginContentId: z.string().min(1),
	startedAt: z.string().datetime(),
});

function getSigningSecret(secret = process.env.BETTER_AUTH_SECRET) {
	if (!secret) throw new Error("BETTER_AUTH_SECRET is required for quiz start tokens");
	return secret;
}

function encode(value: string) {
	return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
	return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string) {
	return createHmac("sha256", secret).update(payload).digest("base64url");
}

export type QuizStartTokenInput = {
	userId: string;
	pluginContentId: string;
	now?: Date;
};

export function createQuizStartToken(input: QuizStartTokenInput, secret?: string) {
	const payload = quizStartPayloadSchema.parse({
		userId: input.userId,
		pluginContentId: input.pluginContentId,
		startedAt: (input.now ?? new Date()).toISOString(),
	});
	const encodedPayload = encode(JSON.stringify(payload));
	return `${encodedPayload}.${sign(encodedPayload, getSigningSecret(secret))}`;
}

export function verifyQuizStartToken(token: string, secret?: string) {
	const [encodedPayload, providedSignature, ...extraParts] = token.split(".");
	if (!encodedPayload || !providedSignature || extraParts.length > 0) return null;

	const expectedSignature = sign(encodedPayload, getSigningSecret(secret));
	const expectedBuffer = Buffer.from(expectedSignature);
	const providedBuffer = Buffer.from(providedSignature);
	if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) return null;

	try {
		return quizStartPayloadSchema.parse(JSON.parse(decode(encodedPayload)));
	} catch {
		return null;
	}
}
