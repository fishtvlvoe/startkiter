import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/mail", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/mail")>();
	return {
		...actual,
		readEmailSettings: vi.fn(),
		getCachedEmailSettings: vi.fn(),
	};
});

import { getCachedEmailSettings, readEmailSettings } from "@startkiter/mail";
import { renderCampaignHtmlAsync, resolveFooterSettings } from "./render";
import {
	captureSenderSnapshot,
	getDefaultRatePerMinute,
} from "./send-engine";

describe("Newsletter integration with Email Settings (DB vs env)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "test-secret-key-12345");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("captureSenderSnapshot", () => {
		it("uses stored DB settings when available", async () => {
			vi.mocked(readEmailSettings).mockResolvedValue({
				fromEmail: "db-sender@example.com",
				newsletterSenderName: "DB Newsletter Name",
				newsletterReplyTo: "db-reply@example.com",
				provider: "tosend",
				tosendApiKey: "tsend_valid_key",
			});

			vi.stubEnv("MAIL_FROM", "env-sender@example.com");
			vi.stubEnv("MAIL_FROM_NAME", "Env Newsletter");
			vi.stubEnv("MAIL_REPLY_TO", "env-reply@example.com");
			vi.stubEnv("EMAIL_PROVIDER", "resend");
			vi.stubEnv("RESEND_API_KEY", "resend-key");

			const snapshot = await captureSenderSnapshot();

			expect(snapshot.fromEmail).toBe("db-sender@example.com");
			expect(snapshot.senderName).toBe("DB Newsletter Name");
			expect(snapshot.replyTo).toBe("db-reply@example.com");
			expect(snapshot.emailProvider).toBe("tosend");
		});

		it("falls back to environment variables when stored DB settings are empty", async () => {
			vi.mocked(readEmailSettings).mockResolvedValue({});

			vi.stubEnv("MAIL_FROM", "env-sender@example.com");
			vi.stubEnv("MAIL_FROM_NAME", "Env Newsletter");
			vi.stubEnv("MAIL_REPLY_TO", "env-reply@example.com");
			vi.stubEnv("EMAIL_PROVIDER", "tosend");
			vi.stubEnv("TOSEND_API_KEY", "tsend-key");

			const snapshot = await captureSenderSnapshot();

			expect(snapshot.fromEmail).toBe("env-sender@example.com");
			expect(snapshot.senderName).toBe("Env Newsletter");
			expect(snapshot.replyTo).toBe("env-reply@example.com");
			expect(snapshot.emailProvider).toBe("tosend");
		});
	});

	describe("getDefaultRatePerMinute", () => {
		it("uses stored DB rate when available", async () => {
			vi.mocked(readEmailSettings).mockResolvedValue({
				newsletterRatePerMinute: 300,
			});
			vi.stubEnv("NEWSLETTER_RATE_PER_MINUTE", "120");

			const rate = await getDefaultRatePerMinute();
			expect(rate).toBe(300);
		});

		it("falls back to NEWSLETTER_RATE_PER_MINUTE environment variable when DB is empty", async () => {
			vi.mocked(readEmailSettings).mockResolvedValue({});
			vi.stubEnv("NEWSLETTER_RATE_PER_MINUTE", "120");

			const rate = await getDefaultRatePerMinute();
			expect(rate).toBe(120);
		});

		it("falls back to 60 when both DB and env are empty", async () => {
			vi.mocked(readEmailSettings).mockResolvedValue({});
			vi.stubEnv("NEWSLETTER_RATE_PER_MINUTE", "");

			const rate = await getDefaultRatePerMinute();
			expect(rate).toBe(60);
		});
	});

	describe("resolveFooterSettings and renderCampaignHtmlAsync", () => {
		it("uses DB footer settings over environment variables", async () => {
			vi.mocked(readEmailSettings).mockResolvedValue({
				footerCompany: "DB Company Ltd",
				footerAddress: "DB Street 100",
				footerEmail: "db-contact@example.com",
			});
			vi.mocked(getCachedEmailSettings).mockReturnValue({
				footerCompany: "DB Company Ltd",
				footerAddress: "DB Street 100",
				footerEmail: "db-contact@example.com",
			});

			vi.stubEnv("NEWSLETTER_FOOTER_COMPANY", "Env Company");
			vi.stubEnv("NEWSLETTER_SENDER_ADDRESS", "Env Street");
			vi.stubEnv("SUPPORT_EMAIL", "env-contact@example.com");

			const footer = await resolveFooterSettings();
			expect(footer.footerCompany).toBe("DB Company Ltd");
			expect(footer.senderPhysicalAddress).toBe("DB Street 100");
			expect(footer.footerEmail).toBe("db-contact@example.com");

			const rendered = await renderCampaignHtmlAsync(
				{
					blocks: [{ type: "paragraph", content: "Test content" }],
				},
				{
					mode: "send",
					recipientUserId: "user-1",
					recipientEmail: "learner@example.com",
					unsubscribeScope: "marketing",
				},
			);

			expect(rendered.html).toContain("DB Company Ltd");
			expect(rendered.html).toContain("DB Street 100");
			expect(rendered.html).toContain("db-contact@example.com");
			expect(rendered.text).toContain("DB Company Ltd");
			expect(rendered.text).toContain("DB Street 100");
			expect(rendered.text).toContain("db-contact@example.com");
		});

		it("falls back to environment variables when DB footer settings are empty", async () => {
			vi.mocked(readEmailSettings).mockResolvedValue({});
			vi.mocked(getCachedEmailSettings).mockReturnValue({});

			vi.stubEnv("NEWSLETTER_FOOTER_COMPANY", "Env Company");
			vi.stubEnv("NEWSLETTER_SENDER_ADDRESS", "Env Street");
			vi.stubEnv("SUPPORT_EMAIL", "env-contact@example.com");

			const footer = await resolveFooterSettings();
			expect(footer.footerCompany).toBe("Env Company");
			expect(footer.senderPhysicalAddress).toBe("Env Street");
			expect(footer.footerEmail).toBe("env-contact@example.com");

			const rendered = await renderCampaignHtmlAsync(
				{
					blocks: [{ type: "paragraph", content: "Test content" }],
				},
				{
					mode: "send",
					recipientUserId: "user-1",
					recipientEmail: "learner@example.com",
					unsubscribeScope: "marketing",
				},
			);

			expect(rendered.html).toContain("Env Company");
			expect(rendered.html).toContain("Env Street");
			expect(rendered.html).toContain("env-contact@example.com");
		});
	});
});
