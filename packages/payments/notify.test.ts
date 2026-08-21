import { describe, expect, it } from "vitest";

import { PayUniService } from "./provider/payuni/crypto";
import { createMemoryOrderStore } from "./memory-store";
import { handlePayuniNotify } from "./notify";
import { MVP_AMOUNT_TWD, MVP_SKU } from "./constants";

const HASH_KEY = "12345678901234567890123456789012";
const HASH_IV = "1234567890123456";

function paidEncryptPayload(orderNo: string) {
	const service = new PayUniService({
		merchantId: "MERCHANT",
		hashKey: HASH_KEY,
		hashIV: HASH_IV,
		apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
	});
	const form = service.createFormData({
		MerTradeNo: orderNo,
		TradeAmt: MVP_AMOUNT_TWD,
		Status: "SUCCESS",
		TradeNo: "PU_TRADE_1",
	});
	return { encryptInfo: form.EncryptInfo, hashInfo: form.HashInfo };
}

describe("Webhook marks order paid / Course and kit same purchase", () => {
	it("first valid notify marks paid and sets both entitlement flags", async () => {
		const store = createMemoryOrderStore();
		const order = store.create({
			userId: "user_1",
			orderNo: "SK-8800-001",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
		});

		const payload = paidEncryptPayload(order.orderNo);
		const result = await handlePayuniNotify({
			encryptInfo: payload.encryptInfo,
			hashInfo: payload.hashInfo,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});

		expect(result.status).toBe(200);
		const updated = store.getByOrderNo(order.orderNo);
		expect(updated?.status).toBe("paid");
		expect(updated?.courseAccess).toBe(true);
		expect(updated?.kitClaimEligible).toBe(true);
	});

	it("duplicate notify is idempotent and does not create a second order", async () => {
		const store = createMemoryOrderStore();
		const order = store.create({
			userId: "user_1",
			orderNo: "SK-8800-001",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
		});
		const payload = paidEncryptPayload(order.orderNo);

		await handlePayuniNotify({
			encryptInfo: payload.encryptInfo,
			hashInfo: payload.hashInfo,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});
		const second = await handlePayuniNotify({
			encryptInfo: payload.encryptInfo,
			hashInfo: payload.hashInfo,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});

		expect(second.status).toBe(200);
		expect(store.list()).toHaveLength(1);
		expect(store.list()[0]?.courseAccess).toBe(true);
		expect(store.list()[0]?.kitClaimEligible).toBe(true);
	});

	it("invalid signature returns 400 and leaves order pending", async () => {
		const store = createMemoryOrderStore();
		store.create({
			userId: "user_1",
			orderNo: "SK-8800-001",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
		});

		const result = await handlePayuniNotify({
			encryptInfo: "deadbeef",
			hashInfo: "BADHASH",
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});

		expect(result.status).toBe(400);
		expect(store.getByOrderNo("SK-8800-001")?.status).toBe("pending");
	});

	it("rejects late SUCCESS notify after refund without reopening entitlements", async () => {
		const store = createMemoryOrderStore();
		store.create({
			userId: "user_1",
			orderNo: "SK-8800-001",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "refunded",
			paymentGateway: "payuni",
			gatewayTradeNo: "PU_TRADE_1",
			courseAccess: false,
			kitClaimEligible: false,
		});

		const payload = paidEncryptPayload("SK-8800-001");
		const result = await handlePayuniNotify({
			encryptInfo: payload.encryptInfo,
			hashInfo: payload.hashInfo,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});

		expect(result.status).toBe(400);
		expect(store.getByOrderNo("SK-8800-001")?.status).toBe("refunded");
		expect(store.getByOrderNo("SK-8800-001")?.courseAccess).toBe(false);
		expect(store.getByOrderNo("SK-8800-001")?.kitClaimEligible).toBe(false);
	});

	it("rejects SUCCESS notify when TradeAmt mismatches locked amount", async () => {
		const store = createMemoryOrderStore();
		store.create({
			userId: "user_1",
			orderNo: "SK-8800-001",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
		});

		const service = new PayUniService({
			merchantId: "MERCHANT",
			hashKey: HASH_KEY,
			hashIV: HASH_IV,
			apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
		});
		const form = service.createFormData({
			MerTradeNo: "SK-8800-001",
			TradeAmt: 1,
			Status: "SUCCESS",
			TradeNo: "PU_TRADE_BAD",
		});

		const result = await handlePayuniNotify({
			encryptInfo: form.EncryptInfo,
			hashInfo: form.HashInfo,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});

		expect(result.status).toBe(400);
		expect(store.getByOrderNo("SK-8800-001")?.status).toBe("pending");
	});

	it("rejects SUCCESS notify without TradeNo", async () => {
		const store = createMemoryOrderStore();
		store.create({
			userId: "user_1",
			orderNo: "SK-8800-001",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
		});

		const service = new PayUniService({
			merchantId: "MERCHANT",
			hashKey: HASH_KEY,
			hashIV: HASH_IV,
			apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
		});
		const form = service.createFormData({
			MerTradeNo: "SK-8800-001",
			TradeAmt: MVP_AMOUNT_TWD,
			Status: "SUCCESS",
			TradeNo: "   ",
		});

		const result = await handlePayuniNotify({
			encryptInfo: form.EncryptInfo,
			hashInfo: form.HashInfo,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});

		expect(result.status).toBe(400);
		expect(result.error).toBe("missing_trade_no");
		expect(store.getByOrderNo("SK-8800-001")?.status).toBe("pending");
	});

	it("marks paid when TradeAmt matches a coupon-discounted order.amount below MVP_AMOUNT_TWD (Requirement: Checkout applies a validated coupon to compute the charged amount)", async () => {
		const store = createMemoryOrderStore();
		const discountedAmount = MVP_AMOUNT_TWD - 100;
		store.create({
			userId: "user_1",
			orderNo: "SK-8800-002",
			sku: MVP_SKU,
			amount: discountedAmount,
			currency: "TWD",
			status: "pending",
			paymentGateway: "payuni",
			gatewayTradeNo: null,
			courseAccess: false,
			kitClaimEligible: false,
		});

		const service = new PayUniService({
			merchantId: "MERCHANT",
			hashKey: HASH_KEY,
			hashIV: HASH_IV,
			apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
		});
		const form = service.createFormData({
			MerTradeNo: "SK-8800-002",
			TradeAmt: discountedAmount,
			Status: "SUCCESS",
			TradeNo: "PU_TRADE_DISCOUNT",
		});

		const result = await handlePayuniNotify({
			encryptInfo: form.EncryptInfo,
			hashInfo: form.HashInfo,
			credentials: {
				merchantId: "MERCHANT",
				hashKey: HASH_KEY,
				hashIV: HASH_IV,
				apiUrl: "https://sandbox-api.payuni.com.tw/api/upp",
			},
			store,
		});

		expect(result.status).toBe(200);
		expect(store.getByOrderNo("SK-8800-002")?.status).toBe("paid");
	});
});
