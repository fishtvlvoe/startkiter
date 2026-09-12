import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		order: {
			findUnique: vi.fn(),
			updateMany: vi.fn(),
		},
		$transaction: vi.fn(),
	},
}));

vi.mock("@startkiter/api/modules/course/lib/order-refunds", () => ({
	refundOrderThroughGateway: vi.fn(),
	withOrderStateLock: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	handleRefundInvoice: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/send-welcome-email", () => ({
	sendWelcomeEmailsForOrder: vi.fn(),
}));

vi.mock("@startkiter/payments", async (importOriginal) => ({
	...(await importOriginal<typeof import("@startkiter/payments")>()),
	createMvpCheckoutGateway: vi.fn(),
}));

import { db } from "@startkiter/database";
import { withOrderStateLock } from "@startkiter/api/modules/course/lib/order-refunds";
import { sendWelcomeEmailsForOrder } from "@startkiter/api/modules/course/lib/send-welcome-email";

import { markOrderPaid } from "./orders";

/**
 * 模擬「advisory lock 失效／跨請求競態」下的唯一鍵衝突：
 * 兩個 pending 檢查都通過後，第二個寫入同一 gatewayTradeNo 會丟 P2002。
 * 這對應 schema `gatewayTradeNo @unique` 與壓測 UniqueConstraintViolation 路徑。
 *
 * 關鍵：P2002 之後同一 tx 進入 aborted（SQLSTATE 25P02），後續同 tx 查詢必須失敗；
 * 冪等讀取只能走 transaction 外的 `db.order.findUnique`（新連線）。
 */
function installRacingOrderState() {
	const state = {
		status: "pending" as string,
		gatewayTradeNo: null as string | null,
		paidTransitions: 0,
	};

	const claimedTradeNos = new Set<string>();

	const orderSnapshot = () => ({
		id: "order-id",
		orderNo: "ORDER-1",
		status: state.status,
		gatewayTradeNo: state.gatewayTradeNo,
		paymentGateway: "payuni",
		courseAccess: state.status === "paid",
		kitClaimEligible: state.status === "paid",
	});

	// Prisma findUnique 回傳 Prisma__OrderClient（Thenable + relation getters），測試只需要純資料。
	vi.mocked(db.order.findUnique).mockImplementation(
		(() => Promise.resolve(orderSnapshot())) as unknown as typeof db.order.findUnique,
	);

	vi.mocked(withOrderStateLock).mockImplementation(async (_orderId, callback) => {
		let aborted = false;

		const assertTransactionActive = () => {
			if (!aborted) {
				return;
			}

			throw Object.assign(
				new Error("current transaction is aborted, commands ignored until end of transaction block"),
				{ code: "25P02" },
			);
		};

		const tx = {
			order: {
				findUnique: vi.fn(async () => {
					assertTransactionActive();
					return orderSnapshot();
				}),
				updateMany: vi.fn(async ({ where, data }: { where: { status?: string }; data: { status?: string; gatewayTradeNo?: string } }) => {
					assertTransactionActive();

					// TOCTOU：先通過 pending 檢查再 yield，模擬併發下多個 writer 同時通過條件更新。
					if (where.status !== "pending" || state.status !== "pending") {
						return { count: 0 };
					}

					await new Promise((resolve) => setTimeout(resolve, 5));

					const tradeNo = data.gatewayTradeNo;
					if (tradeNo && claimedTradeNos.has(tradeNo)) {
						aborted = true;
						const error = Object.assign(new Error("Unique constraint failed on the fields: (`gatewayTradeNo`)"), {
							code: "P2002",
							meta: { target: ["gatewayTradeNo"] },
						});
						throw error;
					}

					if (tradeNo) {
						claimedTradeNos.add(tradeNo);
					}

					state.status = data.status ?? "paid";
					state.gatewayTradeNo = tradeNo ?? state.gatewayTradeNo;
					state.paidTransitions += 1;

					return { count: 1 };
				}),
			},
		};

		return callback(tx as never);
	});

	return state;
}

describe("Concurrent duplicate notifies do not error or double-grant", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("20 concurrent markOrderPaid for the same order stay idempotent", async () => {
		const state = installRacingOrderState();
		const gatewayTradeNo = "SK-EXAMPLE-001";

		const settled = await Promise.allSettled(
			Array.from({ length: 20 }, () => markOrderPaid("order-id", "ORDER-1", gatewayTradeNo, "payuni")),
		);

		const rejected = settled.filter((result) => result.status === "rejected");
		const fulfilled = settled.filter((result) => result.status === "fulfilled");
		const paidCounts = fulfilled.map((result) => (result.status === "fulfilled" ? result.value : 0));

		expect(rejected, "concurrent duplicate must not surface UniqueConstraintViolation").toEqual([]);
		expect(fulfilled).toHaveLength(20);
		expect(paidCounts.reduce((sum, count) => sum + count, 0)).toBe(1);
		expect(state.paidTransitions).toBe(1);
		expect(state.status).toBe("paid");
		expect(state.gatewayTradeNo).toBe(gatewayTradeNo);
		expect(sendWelcomeEmailsForOrder).toHaveBeenCalledTimes(1);
		expect(sendWelcomeEmailsForOrder).toHaveBeenCalledWith("order-id");
	});
});
