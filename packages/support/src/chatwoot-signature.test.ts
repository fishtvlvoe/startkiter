import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
	createChatwootWebhookSignature,
	verifyChatwootWebhookSignature,
} from "./chatwoot-signature";

const SECRET = "chatwoot-webhook-secret";
const BODY = JSON.stringify({ event: "message_created", id: 1 });
const TIMESTAMP = "1710000000";

describe("verifyChatwootWebhookSignature", () => {
	it("accepts a matching Chatwoot HMAC", () => {
		const signature = createChatwootWebhookSignature({
			rawBody: BODY,
			timestamp: TIMESTAMP,
			secret: SECRET,
		});

		expect(
			verifyChatwootWebhookSignature({
				rawBody: BODY,
				timestamp: TIMESTAMP,
				signatureHeader: signature,
				secret: SECRET,
			}),
		).toBe(true);
	});

	it("rejects a missing signature", () => {
		expect(
			verifyChatwootWebhookSignature({
				rawBody: BODY,
				timestamp: TIMESTAMP,
				signatureHeader: null,
				secret: SECRET,
			}),
		).toBe(false);
	});

	it("rejects an empty secret fail-closed", () => {
		const signature = createChatwootWebhookSignature({
			rawBody: BODY,
			timestamp: TIMESTAMP,
			secret: SECRET,
		});

		expect(
			verifyChatwootWebhookSignature({
				rawBody: BODY,
				timestamp: TIMESTAMP,
				signatureHeader: signature,
				secret: "   ",
			}),
		).toBe(false);
	});

	it("rejects a tampered body", () => {
		const signature = createChatwootWebhookSignature({
			rawBody: BODY,
			timestamp: TIMESTAMP,
			secret: SECRET,
		});

		expect(
			verifyChatwootWebhookSignature({
				rawBody: JSON.stringify({ event: "message_created", id: 2 }),
				timestamp: TIMESTAMP,
				signatureHeader: signature,
				secret: SECRET,
			}),
		).toBe(false);
	});

	it("matches Chatwoot's timestamp.body HMAC construction", () => {
		const hex = createHmac("sha256", SECRET).update(`${TIMESTAMP}.${BODY}`).digest("hex");

		expect(
			verifyChatwootWebhookSignature({
				rawBody: BODY,
				timestamp: TIMESTAMP,
				signatureHeader: `sha256=${hex}`,
				secret: SECRET,
			}),
		).toBe(true);
	});
});
