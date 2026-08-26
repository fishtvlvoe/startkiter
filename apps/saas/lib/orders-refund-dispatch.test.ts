import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: { order: { findUnique: vi.fn() } },
}));
vi.mock("@startkiter/api/modules/course/lib/order-refunds", () => ({
	markOrderRefundedByOrderNo: vi.fn(),
}));
vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	handleRefundInvoice: vi.fn(),
}));
vi.mock("./schedule-after", () => ({
	scheduleAfterResponse: vi.fn(),
}));
vi.mock("@startkiter/payments", async (importOriginal) => ({
	...(await importOriginal<typeof import("@startkiter/payments")>()),
	createMvpCheckoutGateway: vi.fn(),
}));
vi.mock("./checkout-gateway-settings", () => ({
	loadGatewayCredentials: vi.fn(),
}));

import { db } from "@startkiter/database";
import { markOrderRefundedByOrderNo } from "@startkiter/api/modules/course/lib/order-refunds";
import { createMvpCheckoutGateway } from "@startkiter/payments";
import { loadGatewayCredentials } from "./checkout-gateway-settings";
import { markOrderRefundedInDb } from "./orders";

describe("database refund gateway dispatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.order.findUnique).mockResolvedValue({
			id: "order-id",
				status: "paid",
				paymentGateway: "shopline",
				gatewayTradeNo: "sl_trade_1",
				amount: 8800,
				currency: "TWD",
		} as never);
		vi.mocked(loadGatewayCredentials).mockResolvedValue({
			gateway: "shopline",
			credentials: { merchantId: "m", apiKey: "k", clientKey: "c", signKey: "s", testMode: true },
		});
		vi.mocked(createMvpCheckoutGateway).mockReturnValue({
			processRefund: vi.fn().mockResolvedValue({ success: true }),
		} as never);
		vi.mocked(markOrderRefundedByOrderNo).mockResolvedValue(1);
	});

	it("calls the originating gateway before marking the order refunded", async () => {
		const gateway = vi.mocked(createMvpCheckoutGateway).mock.results;
		const result = await markOrderRefundedInDb("ORDER-1");

		expect(result).toBe(1);
		expect(createMvpCheckoutGateway).toHaveBeenCalledWith("shopline", expect.anything());
		expect(markOrderRefundedByOrderNo).toHaveBeenCalledWith("ORDER-1");
		expect(gateway).toHaveLength(1);
	});

	it("does not mark the order when the gateway refund fails", async () => {
		vi.mocked(createMvpCheckoutGateway).mockReturnValue({
			processRefund: vi.fn().mockResolvedValue({ success: false, error: "gateway unavailable" }),
		} as never);

		await expect(markOrderRefundedInDb("ORDER-1")).resolves.toBe(0);
		expect(markOrderRefundedByOrderNo).not.toHaveBeenCalled();
	});
});
