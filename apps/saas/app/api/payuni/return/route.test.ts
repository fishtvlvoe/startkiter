import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/orders", () => ({
	loadPayUniCredentials: vi.fn(),
}));

import { loadPayUniCredentials } from "../../../../lib/orders";
import { PayUniService } from "@startkiter/payments";

import { GET, POST } from "./route";

describe("PAYUNi browser return", () => {
	afterEach(() => {
		delete process.env.BETTER_AUTH_URL;
		vi.clearAllMocks();
	});

	it("passes a GET order number to the order-aware return page", async () => {
		process.env.BETTER_AUTH_URL = "http://localhost:3001";
		const response = await GET(new Request("http://localhost:3001/api/payuni/return?orderNo=ORDER-1"));

		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("http://localhost:3001/checkout-return?orderNo=ORDER-1&status=returned");
	});

	it("decrypts a successful PAYUNi POST and passes its order number forward", async () => {
		process.env.BETTER_AUTH_URL = "http://localhost:3001";
		const credentials = {
			merchantId: "MERCHANT",
			hashKey: "12345678901234567890123456789012",
			hashIV: "1234567890123456",
			apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
		};
		vi.mocked(loadPayUniCredentials).mockResolvedValue(credentials);
		const form = new PayUniService(credentials).createFormData({ MerTradeNo: "ORDER-1", Status: "SUCCESS" });
		const body = new URLSearchParams(form as unknown as Record<string, string>);

		const response = await POST(new Request("http://localhost:3001/api/payuni/return", {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body,
		}));

		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("http://localhost:3001/checkout-return?orderNo=ORDER-1&status=returned");
	});
});
