import { describe, expect, it } from "vitest";

import { MVP_AMOUNT_TWD, MVP_CURRENCY, MVP_SKU } from "./constants";
import { buildPendingOrderInput } from "./order";
import { createCheckout } from "./checkout";
import { createMemoryOrderStore } from "./memory-store";

describe("Single MVP SKU price / MVP SKU constant", () => {
	it("locks amount 8800 TWD and sku startkiter-mvp on checkout", async () => {
		const store = createMemoryOrderStore();
		const result = await createCheckout({
			userId: "user_1",
			sessionPresent: true,
			requestedSku: MVP_SKU,
			requestedAmount: 9999,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: "12345678901234567890123456789012",
				hashIV: "1234567890123456",
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
			baseUrl: "http://localhost:3000",
		});

		expect(result.status).toBe(200);
		if (result.status !== 200) {
			return;
		}
		expect(result.order.amount).toBe(MVP_AMOUNT_TWD);
		expect(result.order.currency).toBe(MVP_CURRENCY);
		expect(result.order.sku).toBe(MVP_SKU);
		expect(store.list()).toHaveLength(1);
		expect(store.list()[0]?.sku).toBe(MVP_SKU);
	});

	it("rejects illegal sku with 400", async () => {
		const store = createMemoryOrderStore();
		const result = await createCheckout({
			userId: "user_1",
			sessionPresent: true,
			requestedSku: "other-sku",
			credentials: {
				merchantId: "MERCHANT",
				hashKey: "12345678901234567890123456789012",
				hashIV: "1234567890123456",
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
			baseUrl: "http://localhost:3000",
		});

		expect(result.status).toBe(400);
		expect(store.list()).toHaveLength(0);
	});

	it("fail-closes when order builder receives amount 0 or missing amount", () => {
		expect(() =>
			buildPendingOrderInput({
				userId: "user_1",
				amount: 0,
			}),
		).toThrow(/amount/i);

		expect(() =>
			buildPendingOrderInput({
				userId: "user_1",
				amount: Number.NaN,
			}),
		).toThrow(/amount/i);
	});
});
