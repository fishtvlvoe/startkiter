import { describe, expect, it } from "vitest";

import { MER_TRADE_NO_MAX_LEN, buildPendingOrderInput, generateOrderNo } from "./order";
import { MVP_AMOUNT_TWD, MVP_SKU } from "./constants";

describe("generateOrderNo", () => {
	it(`stays within PAYUNi MerTradeNo max ${MER_TRADE_NO_MAX_LEN}`, () => {
		for (let i = 0; i < 20; i += 1) {
			const orderNo = generateOrderNo();
			expect(orderNo.length).toBeLessThanOrEqual(MER_TRADE_NO_MAX_LEN);
			expect(orderNo).toMatch(/^SK\d{8}[0-9a-f]{12}$/);
		}
	});

	it("buildPendingOrderInput rejects oversized custom orderNo", () => {
		expect(() =>
			buildPendingOrderInput({
				userId: "u1",
				amount: MVP_AMOUNT_TWD,
				sku: MVP_SKU,
				orderNo: "SK-8800-" + "x".repeat(40),
			}),
		).toThrow(/MerTradeNo max length/);
	});
});
