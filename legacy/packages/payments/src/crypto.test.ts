import { describe, expect, it } from "vitest";

import { PayUniService } from "./provider/payuni/crypto";

describe("PayUni crypto", () => {
	it("round-trips encrypt and verifyAndDecrypt", () => {
		const service = new PayUniService({
			merchantId: "MERCHANT",
			hashKey: "12345678901234567890123456789012",
			hashIV: "1234567890123456",
			apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
		});
		const form = service.createFormData({
			MerTradeNo: "SK-8800-001",
			TradeAmt: 8800,
			Status: "SUCCESS",
		});
		const decoded = service.verifyAndDecrypt(form.EncryptInfo, form.HashInfo);
		expect(decoded.MerTradeNo).toBe("SK-8800-001");
		expect(decoded.Status).toBe("SUCCESS");
	});
});
