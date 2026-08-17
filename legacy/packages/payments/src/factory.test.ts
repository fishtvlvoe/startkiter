import { describe, expect, it } from "vitest";

import { createMvpCheckoutGateway } from "./factory";

const credentials = {
	merchantId: "MERCHANT",
	hashKey: "12345678901234567890123456789012",
	hashIV: "1234567890123456",
	apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
};

describe("MVP gateway factory", () => {
	it("creates payuni gateway", () => {
		const gateway = createMvpCheckoutGateway("payuni", credentials);
		expect(gateway.type).toBe("payuni");
	});

	it("rejects shopline and stripe for MVP checkout", () => {
		expect(() => createMvpCheckoutGateway("shopline", credentials)).toThrow(/payuni/i);
		expect(() => createMvpCheckoutGateway("stripe", credentials)).toThrow(/payuni/i);
	});
});
