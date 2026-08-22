import { describe, expect, it } from "vitest";

import { verifyChatwootWebhookToken } from "./chatwoot-signature";

const SECRET = "chatwoot-webhook-secret";
const URL_WITH_TOKEN = `https://startkiter.dev/api/support/webhook/chatwoot?token=${SECRET}`;

describe("verifyChatwootWebhookToken", () => {
	it("accepts a matching token in the query string", () => {
		expect(verifyChatwootWebhookToken({ url: URL_WITH_TOKEN, secret: SECRET })).toBe(true);
	});

	it("rejects a missing token", () => {
		expect(
			verifyChatwootWebhookToken({
				url: "https://startkiter.dev/api/support/webhook/chatwoot",
				secret: SECRET,
			}),
		).toBe(false);
	});

	it("rejects a mismatching token", () => {
		expect(
			verifyChatwootWebhookToken({
				url: "https://startkiter.dev/api/support/webhook/chatwoot?token=wrong",
				secret: SECRET,
			}),
		).toBe(false);
	});

	it("rejects an empty secret fail-closed", () => {
		expect(verifyChatwootWebhookToken({ url: URL_WITH_TOKEN, secret: "   " })).toBe(false);
	});

	it("rejects a missing url", () => {
		expect(verifyChatwootWebhookToken({ url: undefined, secret: SECRET })).toBe(false);
	});

	it("rejects a malformed url", () => {
		expect(verifyChatwootWebhookToken({ url: "not-a-url", secret: SECRET })).toBe(false);
	});
});
