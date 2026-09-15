import { createHmac, timingSafeEqual } from "node:crypto";

export type UnsubscribeScope = "all" | "marketing" | "general";

function secret(): string {
	return process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || "";
}

export function hasDedicatedNewsletterSecret(): boolean {
	return Boolean(process.env.NEWSLETTER_UNSUBSCRIBE_SECRET);
}

function payload(userId: string, email: string, scope: UnsubscribeScope): string {
	return `${userId}:${email.toLowerCase()}:${scope}`;
}

export function createUnsubscribeToken(params: {
	userId: string;
	email: string;
	scope: UnsubscribeScope;
}): string {
	const signingSecret = secret();
	if (!signingSecret) {
		throw new Error("NEWSLETTER_UNSUBSCRIBE_SECRET is required for unsubscribe token signing");
	}
	const sig = createHmac("sha256", signingSecret)
		.update(payload(params.userId, params.email, params.scope))
		.digest("base64url");
	return `${params.userId}.${params.scope}.${sig}`;
}

export function verifyUnsubscribeToken(params: {
	token: string;
	email: string;
}): { ok: boolean; userId?: string; scope?: UnsubscribeScope } {
	if (!secret()) return { ok: false };
	const [userId, scope, sig] = params.token.split(".");
	if (!userId || !scope || !sig || !["all", "marketing", "general"].includes(scope)) {
		return { ok: false };
	}

	const expected = createUnsubscribeToken({
		userId,
		email: params.email,
		scope: scope as UnsubscribeScope,
	}).split(".")[2];

	const left = Buffer.from(sig);
	const right = Buffer.from(expected || "");
	if (left.length !== right.length) {
		timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
		return { ok: false };
	}

	const ok = timingSafeEqual(left, right);
	if (!ok) return { ok: false };

	return {
		ok: true,
		userId,
		scope: scope as UnsubscribeScope,
	};
}
