import { createHmac, timingSafeEqual } from "node:crypto";

export const LINE_SIGNATURE_HEADER = "x-line-signature";

export type LineWebhookEvent = {
	type: string;
	userId: string | null;
	messageText: string | null;
	replyToken: string | null;
	timestamp: number | null;
};

export function createLineWebhookSignature(args: {
	rawBody: string;
	secret: string;
}): string {
	return createHmac("sha256", args.secret).update(args.rawBody).digest("base64");
}

export function verifyLineWebhookSignature(args: {
	rawBody: string;
	signatureHeader: string | null | undefined;
	secret: string | null | undefined;
}): boolean {
	const secret = args.secret?.trim() ?? "";
	const signatureHeader = args.signatureHeader?.trim() ?? "";

	if (!secret || !signatureHeader) {
		return false;
	}

	try {
		const expectedSignature = createLineWebhookSignature({
			rawBody: args.rawBody,
			secret,
		});

		const providedBuffer = Buffer.from(signatureHeader, "base64");
		const expectedBuffer = Buffer.from(expectedSignature, "base64");

		if (
			providedBuffer.length === 0 ||
			providedBuffer.length !== expectedBuffer.length
		) {
			return false;
		}

		return timingSafeEqual(providedBuffer, expectedBuffer);
	} catch {
		return false;
	}
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

export function parseLineWebhookPayload(payload: unknown): LineWebhookEvent[] {
	const record = asRecord(payload);
	if (!record || !Array.isArray(record.events)) {
		return [];
	}

	const result: LineWebhookEvent[] = [];

	for (const item of record.events) {
		const event = asRecord(item);
		if (!event) {
			continue;
		}

		const type = typeof event.type === "string" ? event.type : "";
		const message = asRecord(event.message);
		const source = asRecord(event.source);

		const userId =
			typeof source?.userId === "string" ? source.userId.trim() : null;
		const messageText =
			typeof message?.text === "string" ? message.text : null;
		const replyToken =
			typeof event.replyToken === "string" ? event.replyToken.trim() : null;
		const timestamp =
			typeof event.timestamp === "number" ? event.timestamp : null;

		result.push({
			type,
			userId,
			messageText,
			replyToken,
			timestamp,
		});
	}

	return result;
}
