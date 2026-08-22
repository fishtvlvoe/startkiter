import { timingSafeEqual } from "node:crypto";

export const CHATWOOT_WEBHOOK_TOKEN_PARAM = "token";

function equalStrings(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left, "utf8");
	const rightBuffer = Buffer.from(right, "utf8");
	if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
		return false;
	}
	return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyChatwootWebhookToken(args: {
	url: string | null | undefined;
	secret: string | null | undefined;
}): boolean {
	const secret = args.secret?.trim() ?? "";
	if (!secret || !args.url) {
		return false;
	}

	let token: string | null = null;
	try {
		token = new URL(args.url).searchParams.get(CHATWOOT_WEBHOOK_TOKEN_PARAM);
	} catch {
		return false;
	}

	if (!token) {
		return false;
	}

	return equalStrings(token, secret);
}
