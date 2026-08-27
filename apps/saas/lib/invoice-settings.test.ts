import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		siteSetting: { upsert: vi.fn(), deleteMany: vi.fn() },
		invoice: { findMany: vi.fn() },
		$executeRaw: vi.fn(),
		$transaction: vi.fn(),
	},
}));

vi.mock("@startkiter/api/modules/course/lib/invoice-settings", () => ({
	EINVOICE_SETTING_ID: "einvoice",
	isValidInvoiceCredentialLength: (settings: { provider: "ecpay" | "ezpay"; hashKey: string; hashIV: string }) => settings.hashKey.length === (settings.provider === "ecpay" ? 16 : 32) && settings.hashIV.length === 16,
	withInvoiceOperationLock: vi.fn(async (callback) => callback(db as never)),
	EMPTY_INVOICE_SETTINGS: {
		provider: "ecpay",
		merchantId: "",
		hashKey: "",
		hashIV: "",
		testMode: true,
		sellerName: "",
		sellerTaxId: "",
		autoIssueEnabled: false,
		einvoiceEnabled: false,
	},
	getInvoiceSettings: vi.fn(),
}));

vi.mock("./settings-crypto", () => ({
	encryptSettingsJson: vi.fn(() => "encrypted-settings"),
}));

import { db } from "@startkiter/database";
import { getInvoiceSettings } from "@startkiter/api/modules/course/lib/invoice-settings";
import { writeInvoiceSettings } from "./invoice-settings";

const currentSettings = {
	provider: "ecpay" as const,
	merchantId: "TEST-MERCHANT",
	hashKey: "1234567890123456",
	hashIV: "1234567890123456",
	testMode: true,
	sellerName: "Invoice Settings Test",
	sellerTaxId: "12345678",
	autoIssueEnabled: true,
	einvoiceEnabled: true,
};

describe("writeInvoiceSettings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.SETTINGS_ENCRYPTION_KEY = "invoice-settings-test-secret";
		vi.mocked(getInvoiceSettings).mockResolvedValue(currentSettings);
		vi.mocked(db.invoice.findMany).mockResolvedValue([]);
		vi.mocked(db.siteSetting.upsert).mockResolvedValue({} as never);
		vi.mocked(db.$executeRaw).mockResolvedValue(0);
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(db as never) as never);
	});

	it("blocks switching provider while an issued invoice is outstanding", async () => {
		vi.mocked(db.invoice.findMany)
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([{ amount: 8800, allowanceTotal: 0 }] as never);
		await expect(writeInvoiceSettings({
			patch: { provider: "ezpay", hashKey: "12345678901234567890123456789012" },
			actorUserId: "admin-1",
		})).resolves.toEqual({ ok: false, error: "provider_switch_blocked_existing_issued_invoices" });

		expect(db.invoice.findMany).toHaveBeenNthCalledWith(1, {
			where: {
			OR: [
				{ status: { in: ["PENDING", "FAILED"] } },
				{ attentionReason: { not: null } },
			],
		},
		select: { id: true },
		take: 1,
	});
		expect(db.invoice.findMany).toHaveBeenNthCalledWith(2, {
			where: { status: { in: ["ISSUED", "ALLOWANCE"] } },
			select: { amount: true, allowanceTotal: true },
		});
		expect(db.siteSetting.upsert).not.toHaveBeenCalled();
	});

	it("allows switching provider after all issued invoices are closed", async () => {
		vi.mocked(db.invoice.findMany).mockResolvedValue([]);

		await expect(writeInvoiceSettings({
			patch: { provider: "ezpay", hashKey: "12345678901234567890123456789012" },
			actorUserId: "admin-1",
		})).resolves.toMatchObject({ ok: true, settings: { provider: "ezpay" } });

		expect(db.siteSetting.upsert).toHaveBeenCalledTimes(1);
	});

	it("rejects ezPay settings that retain an ECPay-length hash key", async () => {
		vi.mocked(db.invoice.findMany).mockResolvedValue([]);

		await expect(writeInvoiceSettings({
			patch: { provider: "ezpay" },
			actorUserId: "admin-1",
		})).resolves.toEqual({ ok: false, error: "invalid_invoice_credentials" });

		expect(db.siteSetting.upsert).not.toHaveBeenCalled();
	});

	it("blocks credential rotation while a partially allowed invoice remains actionable", async () => {
		vi.mocked(db.invoice.findMany)
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([{ amount: 8800, allowanceTotal: 300 }] as never);

		await expect(writeInvoiceSettings({
			patch: { hashKey: "9876543210987654" },
			actorUserId: "admin-1",
		})).resolves.toEqual({ ok: false, error: "invoice_settings_change_blocked_existing_actionable_invoices" });

		expect(db.siteSetting.upsert).not.toHaveBeenCalled();
	});

	it("allows credential rotation when all allowance invoices are fully settled", async () => {
		vi.mocked(db.invoice.findMany)
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([{ amount: 8800, allowanceTotal: 8800 }] as never);

		await expect(writeInvoiceSettings({
			patch: { hashKey: "9876543210987654" },
			actorUserId: "admin-1",
		})).resolves.toMatchObject({ ok: true, settings: { hashKey: "9876543210987654" } });

		expect(db.siteSetting.upsert).toHaveBeenCalledTimes(1);
	});

	it("blocks provider rotation while a failed invoice still needs retry", async () => {
		vi.mocked(db.invoice.findMany).mockResolvedValueOnce([{ id: "invoice-1" }] as never);

		await expect(writeInvoiceSettings({
			patch: { provider: "ezpay", hashKey: "12345678901234567890123456789012" },
			actorUserId: "admin-1",
		})).resolves.toEqual({ ok: false, error: "invoice_settings_change_blocked_pending_operations" });

		expect(db.siteSetting.upsert).not.toHaveBeenCalled();
	});
});
