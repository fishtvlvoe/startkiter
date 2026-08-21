import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {},
}));

import { getSupportChannels } from "./get-channels";

describe("GET /support/channels (Task 4.1 & 4.2)", () => {
	beforeEach(() => {
		delete process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
		delete process.env.TELEGRAM_BOT_TOKEN;
	});

	it("returns only WEB_WIDGET when both LINE and Telegram are unconfigured", async () => {
		const result = await call(getSupportChannels, undefined, {
			context: { headers: new Headers() },
		});

		expect(result).toEqual({
			channels: ["WEB_WIDGET"],
			line: false,
			telegram: false,
			webWidget: true,
		});
	});

	it("includes LINE when LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is configured (Task 4.1)", async () => {
		process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN = "line-token-123";

		const result = await call(getSupportChannels, undefined, {
			context: { headers: new Headers() },
		});

		expect(result.channels).toContain("LINE");
		expect(result.channels).toContain("WEB_WIDGET");
		expect(result.channels).not.toContain("TELEGRAM");
		expect(result.line).toBe(true);
		expect(result.telegram).toBe(false);
	});

	it("includes TELEGRAM when TELEGRAM_BOT_TOKEN is configured (Task 4.2)", async () => {
		process.env.TELEGRAM_BOT_TOKEN = "tg-token-456";

		const result = await call(getSupportChannels, undefined, {
			context: { headers: new Headers() },
		});

		expect(result.channels).toContain("TELEGRAM");
		expect(result.channels).toContain("WEB_WIDGET");
		expect(result.channels).not.toContain("LINE");
		expect(result.telegram).toBe(true);
		expect(result.line).toBe(false);
	});

	it("includes all channels when all are configured", async () => {
		process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN = "line-token-123";
		process.env.TELEGRAM_BOT_TOKEN = "tg-token-456";

		const result = await call(getSupportChannels, undefined, {
			context: { headers: new Headers() },
		});

		expect(result.channels).toEqual(["WEB_WIDGET", "LINE", "TELEGRAM"]);
		expect(result.line).toBe(true);
		expect(result.telegram).toBe(true);
		expect(result.webWidget).toBe(true);
	});
});
