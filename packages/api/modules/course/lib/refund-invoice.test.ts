import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:crypto")>()),
	randomUUID: vi.fn(() => "operation-token"),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		invoice: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
		invoiceAllowanceOperation: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
	},
}));
vi.mock("./invoice-settings", () => ({
	getInvoiceSettings: vi.fn(),
	createInvoiceProvider: vi.fn(),
	getInvoiceProvider: vi.fn(),
	isInvoiceProviderName: vi.fn((value: string) => value === "ecpay" || value === "ezpay"),
	withInvoiceOperationLock: vi.fn(async (callback) => callback(db as never)),
	INVOICE_OPERATION_LEASE_MS: 60_000,
}));

import { db } from "@startkiter/database";
import { createInvoiceProvider, getInvoiceProvider, getInvoiceSettings, withInvoiceOperationLock } from "./invoice-settings";
import { handleRefundInvoice, handleRefundInvoiceForSubscription } from "./invoice-events";

const invoice = {
	id: "invoice-1",
	orderId: "order-1",
	subscriptionId: null,
	periodNumber: null,
	provider: "ecpay",
	status: "ISSUED",
	invoiceNumber: "AB12345678",
	randomCode: "1234",
	invoiceDate: new Date("2026-08-10T00:00:00.000Z"),
	amount: 8800,
	allowanceTotal: 0,
	failReason: null,
	attentionReason: null,
	operationToken: null,
	operationStartedAt: null,
	rawResponse: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const crossMonthNow = new Date("2026-09-01T00:00:00.000Z");

describe("refund invoice handling", () => {
	const provider = {
		void: vi.fn().mockResolvedValue({ success: true }),
		allowance: vi.fn().mockResolvedValue({ success: true, allowanceNumber: "AL-1" }),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getInvoiceSettings).mockResolvedValue({ provider: "ecpay" } as never);
		vi.mocked(db.invoice.findUnique)
			.mockResolvedValueOnce(invoice as never)
			.mockResolvedValue({ ...invoice, attentionReason: "REFUND_IN_PROGRESS", operationToken: "operation-token" } as never);
		vi.mocked(db.invoice.update).mockResolvedValue({ ...invoice, status: "VOIDED" } as never);
		vi.mocked(db.invoice.updateMany).mockResolvedValue({ count: 1 } as never);
		vi.mocked(db.invoiceAllowanceOperation.findUnique).mockResolvedValue(null);
		vi.mocked(db.invoiceAllowanceOperation.create).mockResolvedValue({ id: "op-1" } as never);
		vi.mocked(db.invoiceAllowanceOperation.update).mockResolvedValue({ id: "op-1" } as never);
		provider.void.mockResolvedValue({ success: true });
		provider.allowance.mockResolvedValue({ success: true, allowanceNumber: "AL-1" });
		vi.mocked(createInvoiceProvider).mockReturnValue(provider as never);
		vi.mocked(getInvoiceProvider).mockResolvedValue(provider as never);
	});

	// 1.1 R8：同月退款仍走 void（基準線，改動前即應通過）
	it("voids an issued invoice when refund stays in the same billing month", async () => {
		await handleRefundInvoice("order-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(withInvoiceOperationLock).toHaveBeenCalled();
		expect(createInvoiceProvider).toHaveBeenCalledWith({ provider: "ecpay" });
		expect(provider.allowance).not.toHaveBeenCalled();
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: expect.objectContaining({ id: "invoice-1" }),
			data: expect.objectContaining({ status: "VOIDED", attentionReason: null }),
		}));
		expect(provider.void).toHaveBeenCalledWith({
			invoiceNumber: "AB12345678",
			reason: "退款",
			invoiceDate: invoice.invoiceDate,
		});
	});

	// 3.6：行為變更記錄點——跨月改為自動折讓，不再只標記人工
	it("marks a cross-month refund for manual allowance handling", async () => {
		const crossMonthInvoice = { ...invoice, amount: 8800, allowanceTotal: 3000 };
		let state = { ...crossMonthInvoice } as Record<string, unknown>;
		vi.mocked(db.invoice.findUnique).mockReset();
		vi.mocked(db.invoice.findUnique).mockImplementation((async () => ({ ...state })) as never);
		vi.mocked(db.invoice.update).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			state = { ...state, ...data };
			return { ...state } as never;
		}) as never);
		vi.mocked(db.invoice.updateMany).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			state = { ...state, ...data };
			return { count: 1 } as never;
		}) as never);
		vi.mocked(db.invoiceAllowanceOperation.findUnique).mockResolvedValue(null);

		await handleRefundInvoice("order-1", new Date("2026-09-01T00:00:00.000Z"));

		expect(provider.allowance).toHaveBeenCalledWith(expect.objectContaining({
			invoiceNumber: "AB12345678",
			amount: 5800,
		}));
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				status: "ALLOWANCE",
				attentionReason: null,
				allowanceTotal: { increment: 5800 },
			}),
		}));
	});

	it("marks a refund for manual handling when the provider throws", async () => {
		const providerError = new Error("provider timeout");
		vi.mocked(createInvoiceProvider).mockReturnValue({
			void: vi.fn().mockRejectedValue(providerError),
			allowance: vi.fn(),
		} as never);

		await handleRefundInvoice("order-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			where: expect.objectContaining({ id: "invoice-1" }),
			data: expect.objectContaining({ attentionReason: "REFUND_NEEDS_ALLOWANCE", failReason: "provider timeout" }),
		}));
	});

	it("uses the latest issued subscription-period invoice when a subscription is canceled", async () => {
		vi.mocked(db.invoice.findFirst).mockResolvedValue({ ...invoice, orderId: null, subscriptionId: "subscription-1", periodNumber: 2 } as never);

		await handleRefundInvoiceForSubscription("subscription-1", new Date("2026-08-24T00:00:00.000Z"));

		expect(withInvoiceOperationLock).toHaveBeenCalled();
		expect(db.invoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({
			where: { subscriptionId: "subscription-1", status: { in: ["ISSUED", "ALLOWANCE"] } },
			orderBy: { periodNumber: "desc" },
			include: {
				order: { select: { invoiceType: true } },
				subscription: { select: { invoiceType: true } },
			},
		}));
	});
});

describe("auto allowance on cross-month refund（紅燈矩陣 1.2-1.7、1.9）", () => {
	const provider = {
		void: vi.fn().mockResolvedValue({ success: true }),
		allowance: vi.fn().mockResolvedValue({ success: true, allowanceNumber: "AL-1" }),
	};

	const partialInvoice = {
		...invoice,
		amount: 8800,
		allowanceTotal: 3000,
	};

	function stubCrossMonthReservation(seed: Record<string, unknown> = partialInvoice) {
		let state = { ...seed } as Record<string, unknown>;
		vi.mocked(db.invoice.findUnique).mockImplementation((async () => ({ ...state })) as never);
		vi.mocked(db.invoice.update).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			state = { ...state, ...data };
			return { ...state } as never;
		}) as never);
		vi.mocked(db.invoice.updateMany).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			state = { ...state, ...data };
			return { count: 1 } as never;
		}) as never);
		vi.mocked(db.invoiceAllowanceOperation.findUnique).mockResolvedValue(null);
		vi.mocked(db.invoiceAllowanceOperation.create).mockResolvedValue({
			id: "allow-op-1",
			allowanceId: "ALLOW-invoice-1-8800",
			status: "PENDING",
		} as never);
	}

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getInvoiceSettings).mockResolvedValue({ provider: "ecpay" } as never);
		provider.void.mockResolvedValue({ success: true });
		provider.allowance.mockResolvedValue({ success: true, allowanceNumber: "AL-1" });
		vi.mocked(createInvoiceProvider).mockReturnValue(provider as never);
		vi.mocked(getInvoiceProvider).mockResolvedValue(provider as never);
		// 模擬 DB 層 advisory lock：並發呼叫必須排隊，否則測不到真實保護
		let lockChain = Promise.resolve();
		vi.mocked(withInvoiceOperationLock).mockImplementation(async (callback) => {
			const run = lockChain.then(() => callback(db as never));
			lockChain = run.then(
				() => undefined,
				() => undefined,
			);
			return run;
		});
		stubCrossMonthReservation();
	});

	// 1.2 R3+主線：折讓金額 = amount - allowanceTotal（5800，非 8800）
	it("issues a full remaining allowance amount on cross-month refund", async () => {
		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).toHaveBeenCalledWith(expect.objectContaining({
			invoiceNumber: "AB12345678",
			amount: 5800,
		}));
		expect(provider.allowance).not.toHaveBeenCalledWith(expect.objectContaining({ amount: 8800 }));
		expect(provider.void).not.toHaveBeenCalled();
	});

	// 1.3 主線：成功後 status=ALLOWANCE、allowanceTotal 累加、attentionReason 清空
	it("marks the invoice as ALLOWANCE and clears attention after automatic allowance succeeds", async () => {
		await handleRefundInvoice("order-1", crossMonthNow);

		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				status: "ALLOWANCE",
				attentionReason: null,
				allowanceTotal: expect.anything(),
			}),
		}));
		const successWrite = vi.mocked(db.invoice.updateMany).mock.calls.find((call) => {
			const data = call[0]?.data as { status?: string; allowanceTotal?: unknown } | undefined;
			return data?.status === "ALLOWANCE";
		});
		expect(successWrite?.[0]?.data).toEqual(expect.objectContaining({
			status: "ALLOWANCE",
			attentionReason: null,
			allowanceTotal: { increment: 5800 },
		}));
	});

	// 1.4 R5：明確錯誤退回 REFUND_NEEDS_ALLOWANCE + failReason，不可卡在 ALLOWANCE_IN_PROGRESS
	it("falls back to REFUND_NEEDS_ALLOWANCE when automatic allowance fails definitely", async () => {
		provider.allowance.mockResolvedValue({ success: false, error: "折讓被供應商拒絕", ambiguous: false });

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).toHaveBeenCalled();
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				attentionReason: "REFUND_NEEDS_ALLOWANCE",
				failReason: "折讓被供應商拒絕",
			}),
		}));
		const stuck = vi.mocked(db.invoice.updateMany).mock.calls.some((call) => {
			const data = call[0]?.data as { attentionReason?: string } | undefined;
			return data?.attentionReason === "ALLOWANCE_IN_PROGRESS";
		});
		const finalWrites = vi.mocked(db.invoice.updateMany).mock.calls
			.map((call) => (call[0]?.data as { attentionReason?: string } | undefined)?.attentionReason)
			.filter(Boolean);
		expect(finalWrites[finalWrites.length - 1]).toBe("REFUND_NEEDS_ALLOWANCE");
		expect(stuck && finalWrites[finalWrites.length - 1] === "ALLOWANCE_IN_PROGRESS").toBe(false);
	});

	// 1.5 R4：ambiguous 標 ALLOWANCE_NEEDS_REVIEW，不得當成功、不得自動重試
	it("holds ambiguous automatic allowance results for review", async () => {
		provider.allowance.mockResolvedValue({ success: false, error: "折讓結果不明", ambiguous: true });

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).toHaveBeenCalledTimes(1);
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				attentionReason: "ALLOWANCE_NEEDS_REVIEW",
			}),
		}));
		expect(db.invoice.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: "ALLOWANCE" }),
		}));
	});

	// 1.6 R7：已全額折讓完完全不呼叫 provider，且不留待處理 attentionReason
	it("skips provider allowance when the invoice is already fully credited", async () => {
		const fullyCredited = { ...invoice, amount: 8800, allowanceTotal: 8800 };
		stubCrossMonthReservation(fullyCredited);

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).not.toHaveBeenCalled();
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ attentionReason: null }),
		}));
		expect(db.invoice.update).not.toHaveBeenCalledWith(expect.objectContaining({
			data: { attentionReason: "REFUND_NEEDS_ALLOWANCE" },
		}));
	});

	// 1.7 R1：併發兩次退款，provider.allowance 只呼叫一次
	it("only issues one automatic allowance when two refunds race", async () => {
		let state = {
			...partialInvoice,
			attentionReason: null as string | null,
			operationToken: null as string | null,
			operationStartedAt: null as Date | null,
			status: "ISSUED",
			allowanceTotal: 3000,
		};
		let operation: { allowanceId: string; status: string } | null = null;

		vi.mocked(db.invoice.findUnique).mockImplementation((async () => ({ ...state })) as never);
		vi.mocked(db.invoiceAllowanceOperation.findUnique).mockImplementation((async ({ where }: { where: { allowanceId?: string } }) => {
			if (operation && where.allowanceId === operation.allowanceId) return operation as never;
			return null;
		}) as never);
		vi.mocked(db.invoiceAllowanceOperation.create).mockImplementation((async ({ data }: { data: { allowanceId: string } }) => {
			operation = { allowanceId: data.allowanceId, status: "PENDING" };
			return { id: "allow-op-1", ...operation } as never;
		}) as never);
		vi.mocked(db.invoiceAllowanceOperation.update).mockImplementation((async ({ data }: { data: { status?: string } }) => {
			if (operation) operation = { ...operation, status: data.status ?? operation.status };
			return { id: "allow-op-1", ...operation } as never;
		}) as never);
		// 真實 updateMany 是樂觀鎖：where 不符時回 count:0 且不套用變更。
		// mock 必須照做，否則搶佔失敗的那一路會被誤判為成功，這條保護等於沒被測到。
		vi.mocked(db.invoice.updateMany).mockImplementation((async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
			const cond = where as {
				id?: string;
				attentionReason?: string | null;
				operationToken?: string | null;
				status?: { in?: string[] } | string;
				OR?: Array<Record<string, unknown>>;
			};
			const matches = (): boolean => {
				if (cond.id !== undefined && cond.id !== partialInvoice.id) return false;
				if (cond.attentionReason !== undefined && cond.attentionReason !== state.attentionReason) return false;
				if (cond.operationToken !== undefined && cond.operationToken !== state.operationToken) return false;
				if (cond.status !== undefined) {
					const allowed = typeof cond.status === "string" ? [cond.status] : (cond.status.in ?? []);
					if (!allowed.includes(state.status)) return false;
				}
				return true;
			};
			if (!matches()) return { count: 0 } as never;

			const next = data as {
				attentionReason?: string | null;
				operationToken?: string | null;
				operationStartedAt?: Date | null;
				status?: string;
				allowanceTotal?: { increment?: number };
			};
			if (next.attentionReason !== undefined) state.attentionReason = next.attentionReason;
			if (next.operationToken !== undefined) state.operationToken = next.operationToken;
			if (next.operationStartedAt !== undefined) state.operationStartedAt = next.operationStartedAt;
			if (next.status !== undefined) state.status = next.status;
			if (next.allowanceTotal?.increment) state.allowanceTotal += next.allowanceTotal.increment;
			return { count: 1 } as never;
		}) as never);
		vi.mocked(db.invoice.update).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			state = { ...state, ...data } as typeof state;
			return { ...state } as never;
		}) as never);

		await Promise.all([
			handleRefundInvoice("order-1", crossMonthNow),
			handleRefundInvoice("order-1", crossMonthNow),
		]);

		expect(provider.allowance).toHaveBeenCalledTimes(1);
		expect(state.allowanceTotal).toBe(8800);
	});

	// 1.9 R6：void 結果未知時不得自動開折讓
	it.each(["VOID_AFTER_REFUND", "VOID_IN_PROGRESS"] as const)(
		"does not auto-allowance when attentionReason is %s",
		async (attentionReason) => {
			stubCrossMonthReservation({
				...partialInvoice,
				attentionReason,
				operationToken: "existing-token",
				operationStartedAt: new Date(),
			});

			await handleRefundInvoice("order-1", crossMonthNow);

			expect(provider.allowance).not.toHaveBeenCalled();
			expect(db.invoice.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
				data: expect.objectContaining({ status: "ALLOWANCE" }),
			}));
		},
	);

	it("does not auto-allowance when a stale void marker is still unresolved across months", async () => {
		stubCrossMonthReservation({
			...partialInvoice,
			attentionReason: "VOID_AFTER_REFUND",
			operationToken: "stale-token",
			operationStartedAt: new Date(Date.now() - 120_000),
		});

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).not.toHaveBeenCalled();
		expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				attentionReason: "REFUND_NEEDS_ALLOWANCE",
			}),
		}));
	});

	it("auto-allowances remaining credit when invoice status is already ALLOWANCE", async () => {
		stubCrossMonthReservation({
			...partialInvoice,
			status: "ALLOWANCE",
			allowanceTotal: 3000,
		});

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).toHaveBeenCalledWith(expect.objectContaining({ amount: 5800 }));
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				status: "ALLOWANCE",
				allowanceTotal: { increment: 5800 },
			}),
		}));
	});

	// 3.5 F3：ezpay + COMPANY 必須帶 taxExclusive=true
	it("passes taxExclusive for ezpay company invoices on automatic allowance", async () => {
		stubCrossMonthReservation({
			...partialInvoice,
			provider: "ezpay",
			order: { invoiceType: "COMPANY" },
			subscription: null,
		} as never);
		vi.mocked(getInvoiceSettings).mockResolvedValue({ provider: "ezpay" } as never);

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).toHaveBeenCalledWith(expect.objectContaining({
			amount: 5800,
			taxExclusive: true,
		}));
	});

	// 3.7 F7：系統自動折讓留下可追溯標記
	it("records a system trigger marker on automatic allowance operations", async () => {
		await handleRefundInvoice("order-1", crossMonthNow);

		expect(db.invoiceAllowanceOperation.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				errorMessage: "[trigger:system:auto-cross-month-refund]",
			}),
		}));
		expect(db.invoiceAllowanceOperation.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				status: "SUCCEEDED",
				errorMessage: "[trigger:system:auto-cross-month-refund]",
			}),
		}));
	});

	// 1.11 R1+R4：provider 逾時拋錯必須當 ambiguous，禁止當明確失敗重試
	it("locks timeout throws as ALLOWANCE_NEEDS_REVIEW and blocks a second allowance call", async () => {
		let state = { ...partialInvoice } as Record<string, unknown>;
		let operation: { allowanceId: string; status: string } | null = null;

		vi.mocked(db.invoice.findUnique).mockImplementation((async () => ({ ...state })) as never);
		vi.mocked(db.invoice.update).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			state = { ...state, ...data };
			return { ...state } as never;
		}) as never);
		vi.mocked(db.invoice.updateMany).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			state = { ...state, ...data };
			return { count: 1 } as never;
		}) as never);
		vi.mocked(db.invoiceAllowanceOperation.findUnique).mockImplementation((async ({ where }: { where: { allowanceId?: string } }) => {
			if (operation && where.allowanceId === operation.allowanceId) return operation as never;
			return null;
		}) as never);
		vi.mocked(db.invoiceAllowanceOperation.create).mockImplementation((async ({ data }: { data: { allowanceId: string } }) => {
			operation = { allowanceId: data.allowanceId, status: "PENDING" };
			return { id: "allow-op-1", ...operation } as never;
		}) as never);
		vi.mocked(db.invoiceAllowanceOperation.update).mockImplementation((async ({ data }: { data: { status?: string } }) => {
			if (operation) operation = { ...operation, status: data.status ?? operation.status };
			return { id: "allow-op-1", ...operation } as never;
		}) as never);

		provider.allowance.mockRejectedValue(new Error("provider timeout"));

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).toHaveBeenCalledTimes(1);
		expect(db.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				attentionReason: "ALLOWANCE_NEEDS_REVIEW",
			}),
		}));
		expect(db.invoice.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				attentionReason: "REFUND_NEEDS_ALLOWANCE",
			}),
		}));
		expect(db.invoiceAllowanceOperation.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				status: "UNKNOWN",
			}),
		}));
		expect(operation).toEqual(expect.objectContaining({ status: "UNKNOWN" }));

		await handleRefundInvoice("order-1", crossMonthNow);

		expect(provider.allowance).toHaveBeenCalledTimes(1);
	});
});
