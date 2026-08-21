import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
	createLineWebhookSignature,
	LINE_SIGNATURE_HEADER,
	parseLineWebhookPayload,
	verifyLineWebhookSignature,
} from "./line-signature";

const SECRET = "line-channel-secret-12345";
const BODY = JSON.stringify({
	destination: "U1234567890",
	events: [
		{
			type: "message",
			message: {
				type: "text",
				id: "msg_123",
				text: "買家求助訊息",
			},
			timestamp: 1625882000000,
			source: {
				type: "user",
				userId: "U9876543210",
			},
			replyToken: "replyToken123",
			mode: "active",
		},
	],
});

describe("LINE Webhook Signature and Payload", () => {
	it("accepts a matching LINE HMAC-SHA256 Base64 signature", () => {
		const signature = createLineWebhookSignature({
			rawBody: BODY,
			secret: SECRET,
		});

		expect(
			verifyLineWebhookSignature({
				rawBody: BODY,
				signatureHeader: signature,
				secret: SECRET,
			}),
		).toBe(true);
	});

	it("rejects a missing LINE signature header", () => {
		expect(
			verifyLineWebhookSignature({
				rawBody: BODY,
				signatureHeader: null,
				secret: SECRET,
			}),
		).toBe(false);
	});

	it("rejects an empty secret fail-closed", () => {
		const signature = createLineWebhookSignature({
			rawBody: BODY,
			secret: SECRET,
		});

		expect(
			verifyLineWebhookSignature({
				rawBody: BODY,
				signatureHeader: signature,
				secret: "   ",
			}),
		).toBe(false);
	});

	it("rejects a tampered body", () => {
		const signature = createLineWebhookSignature({
			rawBody: BODY,
			secret: SECRET,
		});

		expect(
			verifyLineWebhookSignature({
				rawBody: JSON.stringify({ destination: "tampered" }),
				signatureHeader: signature,
				secret: SECRET,
			}),
		).toBe(false);
	});

	it("matches official LINE Messaging API Base64 HMAC-SHA256 calculation", () => {
		const expectedBase64 = createHmac("sha256", SECRET).update(BODY).digest("base64");

		expect(
			verifyLineWebhookSignature({
				rawBody: BODY,
				signatureHeader: expectedBase64,
				secret: SECRET,
			}),
		).toBe(true);
	});

	it("parses LINE webhook events properly", () => {
		const parsed = parseLineWebhookPayload(JSON.parse(BODY));
		expect(parsed).toEqual([
			{
				type: "message",
				userId: "U9876543210",
				messageText: "買家求助訊息",
				replyToken: "replyToken123",
				timestamp: 1625882000000,
			},
		]);
	});
});
