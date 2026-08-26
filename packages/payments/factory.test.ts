import { describe, expect, it } from "vitest";

import { createMvpCheckoutGateway } from "./factory";
import { ShoplineGateway } from "./provider/shopline/gateway";
import { StripeGateway } from "./provider/stripe/gateway";

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

	it("creates Shopline when Shopline is enabled", () => {
		const gateway = createMvpCheckoutGateway("shopline", {
			merchantId: "shopline-merchant",
			apiKey: "shopline-api-key",
			clientKey: "shopline-client-key",
			signKey: "shopline-sign-key",
			testMode: true,
		});

		expect(gateway).toBeInstanceOf(ShoplineGateway);
		expect(gateway.type).toBe("shopline");
	});

	it("creates Stripe when Stripe is enabled", () => {
		const gateway = createMvpCheckoutGateway("stripe", {
			secretKey: "sk_test_checkout",
			webhookSecret: "whsec_test",
		});

		expect(gateway).toBeInstanceOf(StripeGateway);
		expect(gateway.type).toBe("stripe");
	});

	it("keeps PAYUNi as the fallback gateway", () => {
		const gateway = createMvpCheckoutGateway("payuni", credentials);

		expect(gateway.type).toBe("payuni");
	});
});
