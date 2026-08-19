import { createHmac, timingSafeEqual } from "node:crypto";

export const CHATWOOT_SIGNATURE_HEADER = "x-chatwoot-signature";

export const CHATWOOT_TIMESTAMP_HEADER = "x-chatwoot-timestamp";

const SIGNATURE_PREFIX = "sha256=";

function hmacHex(secret: string, timestamp: string, rawBody: string): string {
	return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

function equalHex(left: string, right: string): boolean {
	try {
		const leftBuffer = Buffer.from(left, "hex");
		const rightBuffer = Buffer.from(right, "hex");
		if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
			return false;
		}
		return timingSafeEqual(leftBuffer, rightBuffer);
	} catch {
		return false;
	}
}

export function verifyChatwootWebhookSignature(args: {
	rawBody: string;
	timestamp: string | null | undefined;
	signatureHeader: string | null | undefined;
	secret: string | null | undefined;
}): boolean {
	const secret = args.secret?.trim() ?? "";
	const timestamp = args.timestamp?.trim() ?? "";
	const signatureHeader = args.signatureHeader?.trim() ?? "";

	if (!secret || !timestamp || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
		return false;
	}

	const provided = signatureHeader.slice(SIGNATURE_PREFIX.length).trim().toLowerCase();
	const expected = hmacHex(secret, timestamp, args.rawBody);

	return equalHex(provided, expected);
}

export function createChatwootWebhookSignature(args: {
	rawBody: string;
	timestamp: string;
	secret: string;
}): string {
	return `${SIGNATURE_PREFIX}${hmacHex(args.secret, args.timestamp, args.rawBody)}`;
}
