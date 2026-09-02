import { call } from "@orpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		invoice: {
			findUnique: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		invoiceAllowanceOperation: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
		$executeRaw: vi.fn(),
		$transaction: vi.fn(),
	},
}));

vi.mock("../lib/invoice-settings", () => ({
	getInvoiceProvider: vi.fn(),
	isInvoiceProviderName: vi.fn((value: string) => value === "ecpay" || value === "ezpay"),
	withInvoiceOperationLock: vi.fn(async (callback) => callback(db as never)),
	INVOICE_OPERATION_LEASE_MS: 60_000,
}));

vi.mock("@startkiter/platform", () => ({
	getClientIp: vi.fn(),
	recordAdminAction: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { recordAdminAction } from "@startkiter/platform";
import { getInvoiceProvider } from "../lib/invoice-settings";
import { issueInvoiceAllowance, voidInvoice } from "./invoice-operations";

const invoice = {
	id: "invoice-1",
	orderId: "order-1",
	status: "ISSUED",
	invoiceNumber: "AB12345678",
	invoiceDate: new Date("2026-08-24T00:00:00.000Z"),
	allowanceTotal: 0,
	amount: 8800,
	provider: "ecpay",
	attentionReason: null,
};

const provider = {
	void: vi.fn().mockResolvedValue({ success: true }),
	allowance: vi.fn().mockResolvedValue({ success: true, allowanceNumber: "AL-1" }),
};

describe("invoice admin audit logging", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-24T12:00:00.000Z"));
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "admin-1", ipAddress: "203.0.113.11" },
			user: { id: "admin-1", email: "admin@example.com", role: "admin" },
		} as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue(invoice as never);
		vi.mocked(db.invoiceAllowanceOperation.findUnique).mockResolvedValue(null);
		vi.mocked(db.invoice.update).mockResolvedValue({ ...invoice, status: "VOIDED" } as never);
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(db.$executeRaw).mockResolvedValue(0);
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(db as never) as never);
		vi.mocked(getInvoiceProvider).mockResolvedValue(provider as never);
		provider.void.mockClear();
		provider.allowance.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("records invoice voiding after the provider and database update succeed", async () => {
		await call(voidInvoice, { invoiceId: "invoice-1" }, { context: { headers: new Headers() } as never });

		expect(getInvoiceProvider).toHaveBeenCalledWith("ecpay");
		expect(recordAdminAction).toHaveBeenCalledWith(
			"admin-1",
			"VOID_INVOICE",
			{ type: "Invoice", id: "invoice-1" },
			{ amount: 8800 },
			"203.0.113.11",
		);
	});

	it("records invoice allowance creation without including the invoice number in details", async () => {
		await call(issueInvoiceAllowance, { invoiceId: "invoice-1", amount: 300 }, { context: { headers: new Headers() } as never });

		expect(getInvoiceProvider).toHaveBeenCalledWith("ecpay");
		expect(provider.allowance).toHaveBeenCalledWith({
			invoiceNumber: "AB12345678",
			amount: 300,
			allowanceId: "ALLOW-invoice-1-300",
			invoiceDate: invoice.invoiceDate,
			taxExclusive: false,
		});
		expect(recordAdminAction).toHaveBeenCalledWith(
			"admin-1",
			"ALLOWANCE_INVOICE",
			{ type: "Invoice", id: "invoice-1" },
			{ amount: 300 },
			"203.0.113.11",
		);
	});

	it("preserves the source order tax mode for an ezPay company allowance", async () => {
		const ezpayInvoice = {
			...invoice,
			provider: "ezpay",
			order: { invoiceType: "COMPANY" },
			subscription: null,
		};
		vi.mocked(db.invoice.findUnique).mockResolvedValue(ezpayInvoice as never);

		await call(issueInvoiceAllowance, { invoiceId: "invoice-1", amount: 300 }, { context: { headers: new Headers() } as never });

		expect(db.invoice.findUnique).toHaveBeenCalledWith({
			where: { id: "invoice-1" },
			include: {
				order: { select: { invoiceType: true } },
				subscription: { select: { invoiceType: true } },
			},
		});
		expect(provider.allowance).toHaveBeenCalledWith(expect.objectContaining({ taxExclusive: true }));
	});

	// 1.8 R2：自動折讓進行中（ALLOWANCE_IN_PROGRESS 未過期）時，admin 手動折讓必須被拒絕
	it("rejects admin allowance while an automatic allowance lease is still active", async () => {
		vi.mocked(db.invoice.findUnique).mockResolvedValue({
			...invoice,
			attentionReason: "ALLOWANCE_IN_PROGRESS",
			operationToken: "active-token",
			operationStartedAt: new Date(),
		} as never);
		vi.mocked(db.invoiceAllowanceOperation.findUnique).mockResolvedValue({
			id: "op-1",
			allowanceId: "ALLOW-invoice-1-300",
			status: "PENDING",
		} as never);

		await expect(
			call(issueInvoiceAllowance, { invoiceId: "invoice-1", amount: 300 }, { context: { headers: new Headers() } as never }),
		).rejects.toMatchObject({
			message: expect.stringMatching(/待確認|禁止重送/),
		});
		expect(provider.allowance).not.toHaveBeenCalled();
	});
});
