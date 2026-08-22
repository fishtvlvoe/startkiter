import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	getAvailableSupportChannels,
	isLineSupportConfigured,
	isTelegramSupportConfigured,
} from "./channel-config";

describe("Support Channel Configuration", () => {
	// 隔離 process.env：本機 .env 可能已填入真的 LINE/Telegram token，
	// 若不隔離會汙染「未傳 env 時 fallback 讀 process.env」的測試斷言。
	beforeEach(() => {
		vi.stubEnv("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN", "");
		vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("LINE Channel Configuration (Task 4.1)", () => {
		it("returns false when LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is unset", () => {
			expect(
				isLineSupportConfigured({
					LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: undefined,
				}),
			).toBe(false);
		});

		it("returns false when LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is empty or whitespace", () => {
			expect(
				isLineSupportConfigured({
					LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: "   ",
				}),
			).toBe(false);
		});

		it("returns true when LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is provided", () => {
			expect(
				isLineSupportConfigured({
					LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: "valid-line-access-token",
				}),
			).toBe(true);
		});

		it("omits LINE from available support channels when not configured", () => {
			const channels = getAvailableSupportChannels({
				LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: undefined,
				TELEGRAM_BOT_TOKEN: "tg-token",
			});
			expect(channels).not.toContain("LINE");
			expect(channels).toContain("WEB_WIDGET");
			expect(channels).toContain("TELEGRAM");
		});
	});

	describe("Telegram Channel Configuration (Task 4.2)", () => {
		it("returns false when TELEGRAM_BOT_TOKEN is unset", () => {
			expect(
				isTelegramSupportConfigured({
					TELEGRAM_BOT_TOKEN: undefined,
				}),
			).toBe(false);
		});

		it("returns false when TELEGRAM_BOT_TOKEN is empty or whitespace", () => {
			expect(
				isTelegramSupportConfigured({
					TELEGRAM_BOT_TOKEN: "   ",
				}),
			).toBe(false);
		});

		it("returns true when TELEGRAM_BOT_TOKEN is provided", () => {
			expect(
				isTelegramSupportConfigured({
					TELEGRAM_BOT_TOKEN: "valid-telegram-bot-token",
				}),
			).toBe(true);
		});

		it("omits TELEGRAM from available support channels when not configured", () => {
			const channels = getAvailableSupportChannels({
				LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: "line-token",
				TELEGRAM_BOT_TOKEN: undefined,
			});
			expect(channels).not.toContain("TELEGRAM");
			expect(channels).toContain("WEB_WIDGET");
			expect(channels).toContain("LINE");
		});
	});

	describe("Default channel availability", () => {
		it("always includes WEB_WIDGET even when all external channels are unset", () => {
			const channels = getAvailableSupportChannels({});
			expect(channels).toEqual(["WEB_WIDGET"]);
		});
	});
});
