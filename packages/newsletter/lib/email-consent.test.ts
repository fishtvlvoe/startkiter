import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update, consentLogCreate, transaction } = vi.hoisted(() => ({
	findUnique: vi.fn(),
	update: vi.fn(),
	consentLogCreate: vi.fn(),
	transaction: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique, update },
		emailConsentLog: { create: consentLogCreate },
		$transaction: transaction,
	},
}));

import { assertEmailConsent, recordEmailConsent } from "./email-consent";

function userFixture(overrides: Record<string, unknown> = {}) {
	return {
		email: "learner@example.com",
		marketingConsent: null,
		generalEmailConsent: true,
		unsubscribedAt: null,
		emailInvalidAt: null,
		...overrides,
	};
}

describe("assertEmailConsent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findUnique.mockResolvedValue(userFixture());
	});

	it("allows transactional email when the address is valid, regardless of newsletter preferences", async () => {
		findUnique.mockResolvedValue(
			userFixture({ marketingConsent: false, generalEmailConsent: false }),
		);

		await expect(assertEmailConsent("user-1", "transactional")).resolves.toEqual({
			allowed: true,
		});
	});

	it("blocks every email type for a hard-invalid address", async () => {
		findUnique.mockResolvedValue(
			userFixture({ emailInvalidAt: new Date("2026-09-01T00:00:00.000Z") }),
		);

		await expect(assertEmailConsent("user-1", "transactional")).resolves.toMatchObject({
			allowed: false,
		});
	});

	it.each([null, false])("requires explicit marketing consent (%s)", async (marketingConsent) => {
		findUnique.mockResolvedValue(userFixture({ marketingConsent }));

		await expect(assertEmailConsent("user-1", "marketing")).resolves.toMatchObject({
			allowed: false,
		});
	});

	it("allows general email under the opt-out default", async () => {
		findUnique.mockResolvedValue(
			userFixture({ generalEmailConsent: true, unsubscribedAt: null }),
		);

		await expect(assertEmailConsent("user-1", "general")).resolves.toEqual({
			allowed: true,
		});
	});

	it("does not let a general unsubscribe change marketing or transactional consent", async () => {
		findUnique.mockResolvedValue(
			userFixture({
				generalEmailConsent: false,
				marketingConsent: true,
				unsubscribedAt: null,
			}),
		);

		await expect(assertEmailConsent("user-1", "general")).resolves.toMatchObject({
			allowed: false,
		});
		findUnique.mockResolvedValue(
			userFixture({
				generalEmailConsent: false,
				marketingConsent: true,
				unsubscribedAt: null,
			}),
		);
		await expect(assertEmailConsent("user-1", "marketing")).resolves.toEqual({
			allowed: true,
		});
		await expect(assertEmailConsent("user-1", "transactional")).resolves.toEqual({
			allowed: true,
		});
	});

	it("updates the consent field and appends an immutable audit record", async () => {
		findUnique.mockResolvedValue({ email: "learner@example.com" });
		update.mockResolvedValue({});
		consentLogCreate.mockResolvedValue({ id: "log-1" });
		transaction.mockResolvedValue([]);

		await recordEmailConsent({
			userId: "user-1",
			consentType: "MARKETING",
			action: "GRANTED",
			source: "checkout",
			ip: "203.0.113.10",
		});

		expect(update).toHaveBeenCalledWith({
			where: { id: "user-1" },
			data: expect.objectContaining({ marketingConsent: true, marketingConsentAt: expect.any(Date) }),
		});
		expect(consentLogCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: "user-1",
				email: "learner@example.com",
				consentType: "MARKETING",
				action: "GRANTED",
				source: "checkout",
				ip: "203.0.113.10",
			}),
		});
		expect(transaction).toHaveBeenCalledTimes(1);
	});
});

describe("mail transport boundary", () => {
	it("keeps assertEmailConsent out of packages/mail provider routing", () => {
		const providerRoot = resolve(import.meta.dirname, "../../mail");
		const files: string[] = [];
		const visit = (directory: string) => {
			for (const entry of readdirSync(directory)) {
				const path = resolve(directory, entry);
				if (statSync(path).isDirectory()) visit(path);
				else if (path.endsWith(".ts") || path.endsWith(".tsx")) files.push(path);
			}
		};
		visit(providerRoot);

		const importsConsentGate = files.some((file) =>
			/\bassertEmailConsent\b/.test(readFileSync(file, "utf8")),
		);
		expect(importsConsentGate).toBe(false);
	});
});
