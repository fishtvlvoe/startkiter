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
	db: {
		invoice: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("../lib/invoice-settings", () => ({
	getInvoiceProvider: vi.fn(),
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
};

describe("invoice admin audit logging", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "admin-1", ipAddress: "203.0.113.11" },
			user: { id: "admin-1", email: "admin@example.com", role: "admin" },
		} as never);
		vi.mocked(db.invoice.findUnique).mockResolvedValue(invoice as never);
		vi.mocked(db.invoice.update).mockResolvedValue({ ...invoice, status: "VOIDED" } as never);
		vi.mocked(getInvoiceProvider).mockResolvedValue({
			void: vi.fn().mockResolvedValue({ success: true }),
			allowance: vi.fn().mockResolvedValue({ success: true, allowanceNumber: "AL-1" }),
		} as never);
	});

	it("records invoice voiding after the provider and database update succeed", async () => {
		await call(voidInvoice, { invoiceId: "invoice-1" }, { context: { headers: new Headers() } as never });

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

		expect(recordAdminAction).toHaveBeenCalledWith(
			"admin-1",
			"ALLOWANCE_INVOICE",
			{ type: "Invoice", id: "invoice-1" },
			{ amount: 300 },
			"203.0.113.11",
		);
	});
});
