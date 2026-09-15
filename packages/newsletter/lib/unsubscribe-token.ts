import { createHmac, timingSafeEqual } from "node:crypto";

import type { UnsubscribeScope } from "./email-consent";

const SCOPES: readonly UnsubscribeScope[] = ["all", "marketing", "general"];

function getSecret(): string {
	const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET?.trim();
	if (!secret) throw new Error("NEWSLETTER_UNSUBSCRIBE_SECRET is required for unsubscribe token signing");
	return secret;
}

function payload(userId: string, email: string, scope: UnsubscribeScope): string {
	return `${userId}:${email}:${scope}`;
}

function signature(userId: string, email: string, scope: UnsubscribeScope): Buffer {
	return createHmac("sha256", getSecret()).update(payload(userId, email, scope), "utf8").digest();
}

export function createUnsubscribeToken(params: {
	userId: string;
	email: string;
	scope: UnsubscribeScope;
}): string {
	if (!SCOPES.includes(params.scope)) throw new Error("invalid_unsubscribe_scope");
	return signature(params.userId, params.email, params.scope).toString("base64url");
}

export const generateUnsubscribeToken = createUnsubscribeToken;

export function verifyUnsubscribeToken(params: {
	userId: string;
	email: string;
	scope: UnsubscribeScope;
	token: string;
}): boolean {
	if (!SCOPES.includes(params.scope)) return false;
	try {
		const actual = Buffer.from(params.token, "base64url");
		const expected = signature(params.userId, params.email, params.scope);
		return actual.length === expected.length && timingSafeEqual(actual, expected);
	} catch {
		return false;
	}
}

export const hasDedicatedNewsletterSecret = (): boolean =>
	Boolean(process.env.NEWSLETTER_UNSUBSCRIBE_SECRET?.trim());
