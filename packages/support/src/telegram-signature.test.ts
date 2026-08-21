import { describe, expect, it } from "vitest";

import {
	parseTelegramWebhookPayload,
	TELEGRAM_SECRET_TOKEN_HEADER,
	verifyTelegramWebhookSecret,
} from "./telegram-signature";

const SECRET = "telegram-secret-token-abcdef";
const PAYLOAD = {
	update_id: 10001,
	message: {
		message_id: 42,
		from: {
			id: 12345678,
			is_bot: false,
			first_name: "Buyer",
			username: "buyer_telegram",
		},
		chat: {
			id: 12345678,
			first_name: "Buyer",
			type: "private",
		},
		date: 1625882000,
		text: "Telegram 買家求助",
	},
};

describe("Telegram Webhook Secret and Payload", () => {
	it("accepts a matching secret token header", () => {
		expect(
			verifyTelegramWebhookSecret({
				secretTokenHeader: SECRET,
				secretToken: SECRET,
			}),
		).toBe(true);
	});

	it("rejects a missing secret token header", () => {
		expect(
			verifyTelegramWebhookSecret({
				secretTokenHeader: null,
				secretToken: SECRET,
			}),
		).toBe(false);
	});

	it("rejects an empty secret fail-closed", () => {
		expect(
			verifyTelegramWebhookSecret({
				secretTokenHeader: SECRET,
				secretToken: "   ",
			}),
		).toBe(false);
	});

	it("rejects a mismatched secret token", () => {
		expect(
			verifyTelegramWebhookSecret({
				secretTokenHeader: "wrong-secret",
				secretToken: SECRET,
			}),
		).toBe(false);
	});

	it("parses Telegram message payload correctly", () => {
		const parsed = parseTelegramWebhookPayload(PAYLOAD);
		expect(parsed).toEqual({
			messageId: 42,
			chatId: 12345678,
			userId: "12345678",
			username: "buyer_telegram",
			firstName: "Buyer",
			messageText: "Telegram 買家求助",
		});
	});
});
