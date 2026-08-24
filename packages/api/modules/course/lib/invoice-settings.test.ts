import { createCipheriv, createHash, randomBytes } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: { siteSetting: { findUnique: vi.fn() } },
}));

vi.mock("@startkiter/payments", () => ({
	createEcpayInvoiceProvider: vi.fn(() => ({ provider: "ecpay" })),
	createEzpayInvoiceProvider: vi.fn(() => ({ provider: "ezpay" })),
}));

import { db } from "@startkiter/database";
import { createEcpayInvoiceProvider, createEzpayInvoiceProvider } from "@startkiter/payments";

import { getInvoiceProvider } from "./invoice-settings";

const encryptionSecret = "invoice-settings-test-secret";

function encryptSettings(settings: Record<string, unknown>, secret = encryptionSecret): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret, "utf8").digest(), iv);
	const ciphertext = Buffer.concat([cipher.update(JSON.stringify(settings), "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

function settings(provider: "ecpay" | "ezpay") {
	return {
		provider,
		merchantId: "TEST-MERCHANT",
		hashKey: "1234567890123456",
		hashIV: "1234567890123456",
		testMode: true,
		sellerName: "Invoice Settings Test",
		sellerTaxId: "12345678",
		autoIssueEnabled: true,
		einvoiceEnabled: true,
	};
}

describe("invoice provider settings", () => {
	beforeEach(() => {
		process.env.SETTINGS_ENCRYPTION_KEY = encryptionSecret;
		vi.clearAllMocks();
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue({
			id: "einvoice",
			ciphertext: encryptSettings(settings("ecpay")),
			updatedAt: new Date(),
			updatedBy: null,
		} as never);
	});

	afterEach(() => {
		delete process.env.SETTINGS_ENCRYPTION_KEY;
	});

	it("selects the ECPay provider from encrypted settings", async () => {
		const provider = await getInvoiceProvider();

		expect(provider).toEqual({ provider: "ecpay" });
		expect(createEcpayInvoiceProvider).toHaveBeenCalledWith({
		merchantId: "TEST-MERCHANT",
		hashKey: "1234567890123456",
		hashIV: "1234567890123456",
		testMode: true,
	});
	});

	it("selects the ezPay provider from encrypted settings", async () => {
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue({
			id: "einvoice",
			ciphertext: encryptSettings(settings("ezpay")),
			updatedAt: new Date(),
			updatedBy: null,
		});

		const provider = await getInvoiceProvider();

		expect(provider).toEqual({ provider: "ezpay" });
		expect(createEzpayInvoiceProvider).toHaveBeenCalledWith({
		merchantId: "TEST-MERCHANT",
		hashKey: "1234567890123456",
		hashIV: "1234567890123456",
		testMode: true,
	});
	});

	it("fails closed when the encryption key cannot decrypt settings", async () => {
		process.env.SETTINGS_ENCRYPTION_KEY = "wrong-key";

		expect(await getInvoiceProvider()).toBeNull();
		expect(createEcpayInvoiceProvider).not.toHaveBeenCalled();
		expect(createEzpayInvoiceProvider).not.toHaveBeenCalled();
	});
});
