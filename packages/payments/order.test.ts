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

describe("buildPendingOrderInput amount handling (Requirement: Checkout applies a validated coupon to compute the charged amount)", () => {
	it("returns the server-computed amount unchanged when it equals the MVP price", () => {
		const pending = buildPendingOrderInput({ userId: "u1", amount: MVP_AMOUNT_TWD });
		expect(pending.amount).toBe(MVP_AMOUNT_TWD);
	});

	it("accepts and returns a discounted amount below the MVP price", () => {
		const pending = buildPendingOrderInput({ userId: "u1", amount: MVP_AMOUNT_TWD - 100 });
		expect(pending.amount).toBe(MVP_AMOUNT_TWD - 100);
	});

	it("rejects an amount greater than the MVP price", () => {
		expect(() => buildPendingOrderInput({ userId: "u1", amount: MVP_AMOUNT_TWD + 1 })).toThrow(
			/Order amount must be/,
		);
	});

	it("rejects a zero amount", () => {
		expect(() => buildPendingOrderInput({ userId: "u1", amount: 0 })).toThrow(/positive number/);
	});
});
