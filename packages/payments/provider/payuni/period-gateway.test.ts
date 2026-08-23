import { beforeEach, describe, expect, it, vi } from "vitest";

import { PayUniService } from "./crypto";
import { PayUniPeriodGateway } from "./period-gateway";

const credentials = {
	merchantId: "MERCHANT",
	hashKey: "12345678901234567890123456789012",
	hashIV: "1234567890123456",
	apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
};

describe("PayUniPeriodGateway", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("creates the PAYUNi period form-post payload through SubscriptionGateway", async () => {
		const gateway = new PayUniPeriodGateway(credentials);

		const result = await gateway.createSubscriptionSession({
			subscriptionId: "subscription-1",
			gatewayTradeNo: "SUBTRADE001",
			pricePerPeriod: 390,
			interval: "MONTH",
			courseTitle: "Course title",
			baseUrl: "https://startkiter.example",
			payerEmail: "buyer@example.com",
		});

		expect(result.type).toBe("form_post");
		expect(result.formData.apiUrl).toContain("/api/period/Page");
		const payload = new PayUniService(credentials).verifyAndDecrypt(
			result.formData.EncryptInfo,
			result.formData.HashInfo,
		);
		expect(payload).toMatchObject({
			MerTradeNo: "SUBTRADE001",
			PeriodAmt: "390",
			PeriodType: "month",
			PeriodTimes: "900",
			FType: "build",
			API3D: "1",
			PayerEmail: "buyer@example.com",
		});
	});

	it("cancels a period through mdfStatus", async () => {
		const service = new PayUniService(credentials);
		const response = service.createFormData({ Status: "SUCCESS" });
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify(response)));
		const gateway = new PayUniPeriodGateway(credentials);

		await expect(gateway.cancelSubscription({ gatewaySubscriptionId: "PERIOD001" })).resolves.toEqual({
			success: true,
		});
		const body = String(fetchMock.mock.calls[0]?.[1]?.body);
		const submitted = new URLSearchParams(body);
		const payload = service.verifyAndDecrypt(
			submitted.get("EncryptInfo") ?? "",
			submitted.get("HashInfo") ?? "",
		);
		expect(payload).toMatchObject({
			PeriodTradeNo: "PERIOD001",
			ReviseTradeStatus: "end",
		});
	});

	it("surfaces a failed mdfStatus response without claiming cancellation", async () => {
		const service = new PayUniService(credentials);
		const response = service.createFormData({ Status: "FAILED", Message: "declined" });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(response)));
		const gateway = new PayUniPeriodGateway(credentials);

		await expect(gateway.cancelSubscription({ gatewaySubscriptionId: "PERIOD001" })).resolves.toEqual({
			success: false,
			error: "declined",
		});
	});
});
