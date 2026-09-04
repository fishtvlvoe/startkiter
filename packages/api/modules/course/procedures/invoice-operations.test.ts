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
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
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
import { issueInvoiceAllowance, resolveInvoiceReview, voidInvoice } from "./invoice-operations";

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

describe("resolveInvoiceReview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "admin-1", ipAddress: "203.0.113.11" },
			user: { id: "admin-1", email: "admin@example.com", role: "admin" },
		} as never);
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(db as never) as never);
	});

	it("resolves ALLOWANCE_NEEDS_REVIEW as SUCCEEDED and increments allowanceTotal by the UNKNOWN operation amount", async () => {
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(db.invoiceAllowanceOperation.findFirst).mockResolvedValue({
			id: "op-1",
			allowanceId: "ALLOW-invoice-1-300",
			amount: 300,
			status: "UNKNOWN",
		} as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue({
			...invoice,
			status: "ALLOWANCE",
			allowanceTotal: 300,
			attentionReason: null,
		} as never);

		const result = await call(
			resolveInvoiceReview,
			{ invoiceId: "invoice-1", attentionReason: "ALLOWANCE_NEEDS_REVIEW", outcome: "SUCCEEDED" },
			{ context: { headers: new Headers() } as never },
		);

		expect(db.invoice.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ id: "invoice-1", attentionReason: "ALLOWANCE_NEEDS_REVIEW" }),
				data: expect.objectContaining({ status: "ALLOWANCE", attentionReason: null }),
			}),
		);
		expect(db.invoiceAllowanceOperation.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { allowanceId: "ALLOW-invoice-1-300" },
				data: expect.objectContaining({ status: "SUCCEEDED" }),
			}),
		);
		expect(result.invoice.status).toBe("ALLOWANCE");
	});

	it("resolves ALLOWANCE_NEEDS_REVIEW as FAILED and clears attentionReason without changing allowanceTotal", async () => {
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(db.invoiceAllowanceOperation.findFirst).mockResolvedValue({
			id: "op-1",
			allowanceId: "ALLOW-invoice-1-300",
			amount: 300,
			status: "UNKNOWN",
		} as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue({
			...invoice,
			status: "ISSUED",
			attentionReason: null,
		} as never);

		await call(
			resolveInvoiceReview,
			{ invoiceId: "invoice-1", attentionReason: "ALLOWANCE_NEEDS_REVIEW", outcome: "FAILED" },
			{ context: { headers: new Headers() } as never },
		);

		expect(db.invoice.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ attentionReason: null }),
			}),
		);
		const updateManyData = vi.mocked(db.invoice.updateMany).mock.calls[0]?.[0]?.data as Record<string, unknown>;
		expect(updateManyData.status).toBeUndefined();
		expect(updateManyData.allowanceTotal).toBeUndefined();
		expect(db.invoiceAllowanceOperation.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { allowanceId: "ALLOW-invoice-1-300" },
				data: expect.objectContaining({ status: "FAILED" }),
			}),
		);
	});

	it("resolves VOID_NEEDS_REVIEW as SUCCEEDED and sets status to VOIDED", async () => {
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue({ ...invoice, status: "VOIDED", attentionReason: null } as never);

		const result = await call(
			resolveInvoiceReview,
			{ invoiceId: "invoice-1", attentionReason: "VOID_NEEDS_REVIEW", outcome: "SUCCEEDED" },
			{ context: { headers: new Headers() } as never },
		);

		expect(db.invoice.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ id: "invoice-1", attentionReason: "VOID_NEEDS_REVIEW" }),
				data: expect.objectContaining({ status: "VOIDED", attentionReason: null }),
			}),
		);
		expect(result.invoice.status).toBe("VOIDED");
	});

	it("resolves VOID_NEEDS_REVIEW as FAILED and clears attentionReason, leaving status ISSUED", async () => {
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue({ ...invoice, status: "ISSUED", attentionReason: null } as never);

		const result = await call(
			resolveInvoiceReview,
			{ invoiceId: "invoice-1", attentionReason: "VOID_NEEDS_REVIEW", outcome: "FAILED" },
			{ context: { headers: new Headers() } as never },
		);

		const updateManyData = vi.mocked(db.invoice.updateMany).mock.calls[0]?.[0]?.data as Record<string, unknown>;
		expect(updateManyData.status).toBeUndefined();
		expect(result.invoice.status).toBe("ISSUED");
		expect(result.invoice.attentionReason).toBeNull();
	});

	it("rejects SUCCEEDED resolution for ALLOWANCE_NEEDS_REVIEW when no UNKNOWN operation exists", async () => {
		vi.mocked(db.invoiceAllowanceOperation.findFirst).mockResolvedValue(null);

		await expect(
			call(
				resolveInvoiceReview,
				{ invoiceId: "invoice-1", attentionReason: "ALLOWANCE_NEEDS_REVIEW", outcome: "SUCCEEDED" },
				{ context: { headers: new Headers() } as never },
			),
		).rejects.toThrow();
		expect(db.invoice.updateMany).not.toHaveBeenCalled();
	});

	it("fails the second concurrent resolveInvoiceReview call on the same invoice and does not double-apply", async () => {
		vi.mocked(db.invoiceAllowanceOperation.findFirst).mockResolvedValue({
			id: "op-1",
			allowanceId: "ALLOW-invoice-1-300",
			amount: 300,
			status: "UNKNOWN",
		} as never);
		vi.mocked(db.invoice.updateMany)
			.mockResolvedValueOnce({ count: 1 } as never)
			.mockResolvedValueOnce({ count: 0 } as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue({
			...invoice,
			status: "ALLOWANCE",
			allowanceTotal: 300,
			attentionReason: null,
		} as never);

		await call(
			resolveInvoiceReview,
			{ invoiceId: "invoice-1", attentionReason: "ALLOWANCE_NEEDS_REVIEW", outcome: "SUCCEEDED" },
			{ context: { headers: new Headers() } as never },
		);
		await expect(
			call(
				resolveInvoiceReview,
				{ invoiceId: "invoice-1", attentionReason: "ALLOWANCE_NEEDS_REVIEW", outcome: "SUCCEEDED" },
				{ context: { headers: new Headers() } as never },
			),
		).rejects.toThrow();

		expect(db.invoice.updateMany).toHaveBeenCalledTimes(2);
	});
});
