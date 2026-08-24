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
		order: { findUnique: vi.fn() },
	},
}));

vi.mock("../lib/order-refunds", () => ({
	markOrderRefundedById: vi.fn(),
}));

vi.mock("../lib/invoice-events", () => ({
	handleRefundInvoice: vi.fn(),
}));

vi.mock("@startkiter/platform", () => ({
	getClientIp: vi.fn(),
	recordAdminAction: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { handleRefundInvoice } from "../lib/invoice-events";
import { markOrderRefundedById } from "../lib/order-refunds";
import { recordAdminAction } from "@startkiter/platform";
import { refundOrder } from "./refund-order";

describe("refundOrder procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "admin-1", ipAddress: "203.0.113.10" },
			user: { id: "admin-1", email: "admin@example.com", role: "admin" },
		} as never);
		vi.mocked(markOrderRefundedById).mockResolvedValue(1);
		vi.mocked(handleRefundInvoice).mockResolvedValue(null);
		vi.mocked(db.order.findUnique).mockResolvedValue({ id: "order-1", status: "refunded", amount: 8800 } as never);
	});

	it("allows an admin to refund an order and then handles its invoice", async () => {
		const result = await call(
			refundOrder,
			{ orderId: "order-1" },
			{ context: { headers: new Headers() } as never },
		);

		expect(markOrderRefundedById).toHaveBeenCalledWith("order-1");
		expect(handleRefundInvoice).toHaveBeenCalledWith("order-1");
		expect(recordAdminAction).toHaveBeenCalledWith(
			"admin-1",
			"REFUND_ORDER",
			{ type: "Order", id: "order-1" },
			{ amount: 8800 },
			"203.0.113.10",
		);
		expect(result).toMatchObject({ order: { id: "order-1", status: "refunded" } });
	});

	it("rejects an order that is not pending or paid", async () => {
		vi.mocked(markOrderRefundedById).mockResolvedValue(0);

		await expect(
			call(refundOrder, { orderId: "order-1" }, { context: { headers: new Headers() } as never }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(handleRefundInvoice).not.toHaveBeenCalled();
	});
});
