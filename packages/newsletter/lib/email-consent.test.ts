import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, create, update, transaction } = vi.hoisted(() => ({
	findUnique: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique, update },
		emailConsentLog: { create },
		$transaction: transaction,
	},
}));

describe("assertEmailConsent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetModules();
	});

	it("allows transactional when emailInvalidAt is null regardless of marketing/general consent", async () => {
		findUnique.mockResolvedValue({
			email: "learner@example.com",
			marketingConsent: null,
			generalEmailConsent: false,
			unsubscribedAt: new Date(),
			emailInvalidAt: null,
			emailBounceState: "NONE",
		});

		const { assertEmailConsent } = await import("./email-consent");
		await expect(assertEmailConsent("user_1", "transactional")).resolves.toEqual({
			allowed: true,
		});
	});

	it("blocks transactional when emailInvalidAt is set", async () => {
		findUnique.mockResolvedValue({
			email: "learner@example.com",
			marketingConsent: true,
			generalEmailConsent: true,
			unsubscribedAt: null,
			emailInvalidAt: new Date("2026-01-01T00:00:00.000Z"),
			emailBounceState: "HARD_BOUNCED",
		});

		const { assertEmailConsent } = await import("./email-consent");
		await expect(assertEmailConsent("user_1", "transactional")).resolves.toEqual({
			allowed: false,
			reason: "email_invalid_or_complained",
		});
	});

	it("requires marketingConsent === true for marketing", async () => {
		findUnique.mockResolvedValue({
			email: "learner@example.com",
			marketingConsent: null,
			generalEmailConsent: true,
			unsubscribedAt: null,
			emailInvalidAt: null,
			emailBounceState: "NONE",
		});

		const { assertEmailConsent } = await import("./email-consent");
		await expect(assertEmailConsent("user_1", "marketing")).resolves.toEqual({
			allowed: false,
			reason: "marketing_consent_missing",
		});
	});

	it("allows general when generalEmailConsent is true and unsubscribedAt is null", async () => {
		findUnique.mockResolvedValue({
			email: "learner@example.com",
			marketingConsent: false,
			generalEmailConsent: true,
			unsubscribedAt: null,
			emailInvalidAt: null,
			emailBounceState: "NONE",
		});

		const { assertEmailConsent } = await import("./email-consent");
		await expect(assertEmailConsent("user_1", "general")).resolves.toEqual({
			allowed: true,
		});
	});

	it("does not import assertEmailConsent from packages/mail provider routing", () => {
		const mailProviderDir = join(
			dirname(fileURLToPath(import.meta.url)),
			"../../mail/provider",
		);
		const indexSource = readFileSync(join(mailProviderDir, "index.ts"), "utf8");
		const resendSource = readFileSync(join(mailProviderDir, "resend.ts"), "utf8");
		const tosendSource = readFileSync(join(mailProviderDir, "tosend.ts"), "utf8");

		for (const source of [indexSource, resendSource, tosendSource]) {
			expect(source).not.toMatch(/assertEmailConsent/);
			expect(source).not.toMatch(/@startkiter\/newsletter/);
		}
	});
});

describe("recordMarketingConsent audit log", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findUnique.mockResolvedValue({ email: "buyer@example.com" });
		update.mockResolvedValue({});
		create.mockResolvedValue({});
	});

	it("writes EmailConsentLog with source=checkout when granted at checkout", async () => {
		const { recordMarketingConsent } = await import("./email-consent");
		await recordMarketingConsent({
			userId: "user_1",
			source: "checkout",
			granted: true,
			ip: "127.0.0.1",
		});

		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: "user_1",
					email: "buyer@example.com",
					consentType: "MARKETING",
					action: "GRANTED",
					source: "checkout",
				}),
			}),
		);
	});
});
