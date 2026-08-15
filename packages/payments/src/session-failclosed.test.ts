import { describe, expect, it } from "vitest";

import { MVP_SKU } from "./constants";
import { createCheckout } from "./checkout";
import { createMemoryOrderStore } from "./memory-store";

describe("Checkout session and PAYUNi fail-closed", () => {
	it("rejects unauthenticated checkout with 401 and creates no order", async () => {
		const store = createMemoryOrderStore();
		const result = await createCheckout({
			userId: null,
			sessionPresent: false,
			requestedSku: MVP_SKU,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: "12345678901234567890123456789012",
				hashIV: "1234567890123456",
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
			baseUrl: "http://localhost:3000",
		});

		expect(result.status).toBe(401);
		expect(store.list()).toHaveLength(0);
	});

	it("returns 503 not 500 when PAYUNi keys are missing", async () => {
		const store = createMemoryOrderStore();
		const result = await createCheckout({
			userId: "user_1",
			sessionPresent: true,
			requestedSku: MVP_SKU,
			credentials: null,
			store,
			baseUrl: "http://localhost:3000",
		});

		expect(result.status).toBe(503);
		expect(result.status).not.toBe(500);
		expect(store.list()).toHaveLength(0);
	});
});
