import { beforeEach, describe, expect, it, vi } from "vitest";

import { PayUniService } from "./crypto";
import { PayUniOneTimeGateway } from "./gateway";

const credentials = {
	merchantId: "MERCHANT",
	hashKey: "12345678901234567890123456789012",
	hashIV: "1234567890123456",
	apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
};

describe("PayUniOneTimeGateway refunds", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("closes a captured trade through the PAYUNi refund API", async () => {
		const service = new PayUniService(credentials);
		const query = service.createFormData({ Status: "SUCCESS", CloseStatus: "2", TradeAmt: "8800" });
		const close = service.createFormData({ Status: "SUCCESS" });
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			new Response(JSON.stringify(query)),
		).mockResolvedValueOnce(new Response(JSON.stringify(close)));

		await expect(new PayUniOneTimeGateway(credentials).processRefund({
			gatewayPaymentId: "PAYUNI-TRADE-1",
			orderNo: "ORDER-1",
			amount: 8800,
			currency: "TWD",
		})).resolves.toEqual({ success: true });

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("https://sandbox-api.payuni.com.tw/api/trade/query");
		expect(fetchMock.mock.calls[1]?.[0]).toBe("https://sandbox-api.payuni.com.tw/api/trade/close");
		const closeRequest = fetchMock.mock.calls[1]?.[1];
		const closeBody = new URLSearchParams(String(closeRequest?.body));
		const closePayload = service.verifyAndDecrypt(closeBody.get("EncryptInfo") ?? "", closeBody.get("HashInfo") ?? "");
		expect(closePayload).toMatchObject({ TradeNo: "PAYUNI-TRADE-1", CloseType: "2", TradeAmt: "8800" });
	});

	it("uses a bounded total timeout across PAYUNi refund requests", async () => {
		const requestApi = vi.spyOn(PayUniService.prototype, "requestApi")
			.mockResolvedValueOnce({ Status: "SUCCESS", CloseStatus: "2", TradeAmt: "8800" })
			.mockResolvedValueOnce({ Status: "SUCCESS" });

		await expect(new PayUniOneTimeGateway(credentials).processRefund({ gatewayPaymentId: "PAYUNI-TRADE-1" })).resolves.toEqual({ success: true });

		expect(requestApi).toHaveBeenCalledTimes(2);
		for (const call of requestApi.mock.calls) {
			expect(call[2]?.timeoutMs).toEqual(expect.any(Number));
			expect(call[2]?.timeoutMs).toBeLessThanOrEqual(10_000);
		}
	});

	it("keeps the timeout active while reading a stalled PAYUNi response body", async () => {
		vi.useFakeTimers();
		try {
			const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => ({
				ok: true,
				status: 200,
				text: () => new Promise<string>((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
				}),
			} as Response));
			const pending = new PayUniService(credentials).requestApi(credentials.apiUrl, { Status: "SUCCESS" }, { timeoutMs: 10 });
			const assertion = expect(pending).rejects.toThrow("PAYUNi API request timed out");

			await vi.advanceTimersByTimeAsync(10);
			await assertion;
			expect(fetchMock).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it("treats an already closed trade as idempotently refunded", async () => {
		const service = new PayUniService(credentials);
		const query = service.createFormData({ Status: "SUCCESS", CloseStatus: "3" });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(query)));

		await expect(new PayUniOneTimeGateway(credentials).processRefund({
			gatewayPaymentId: "PAYUNI-TRADE-1",
		})).resolves.toEqual({ success: true });
	});

	it("does not mark a trade refundable when PAYUNi rejects the query", async () => {
		const service = new PayUniService(credentials);
		const query = service.createFormData({ Status: "FAILED", Message: "not found" });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(query)));

		await expect(new PayUniOneTimeGateway(credentials).processRefund({
			gatewayPaymentId: "PAYUNI-TRADE-1",
		})).resolves.toMatchObject({ success: false, error: expect.stringContaining("not found") });
	});
});
