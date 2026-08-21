import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterEach, describe, expect, it } from "vitest";

import { validateCoupon } from "./validate";

describe.sequential("packages/coupons validateCoupon", () => {
	const createdCouponIds: string[] = [];

	afterEach(async () => {
		for (const id of createdCouponIds.splice(0)) {
			await db.coupon.delete({ where: { id } }).catch(() => {});
		}
	});

	async function createTestCoupon(overrides: Partial<Parameters<typeof db.coupon.create>[0]["data"]>) {
		// 固定字面碼（如 SAVE100）可能是前一次中斷的測試留下的殘料，先清掉避免 unique constraint 誤判。
		if (overrides.code) {
			await db.coupon.deleteMany({ where: { code: overrides.code as string } });
		}
		const coupon = await db.coupon.create({
			data: {
				code: `TEST${randomUUID().slice(0, 8).toUpperCase()}`,
				discountType: "amount",
				amountOff: 100,
				...overrides,
			},
		});
		createdCouponIds.push(coupon.id);
		return coupon;
	}

	it("固定金額折扣：SAVE100 折抵 100 元，原價 8800 → 8700 (Scenario: Valid unexpired coupon under redemption limit)", async () => {
		const coupon = await createTestCoupon({ code: "SAVE100", discountType: "amount", amountOff: 100 });

		const result = await validateCoupon(coupon.code, 8800);

		expect(result).toEqual({ valid: true, discountAmount: 100, finalAmount: 8700 });
	});

	it("百分比折扣有上限：SAVE20PCT 20% 但 maxDiscountAmount=500，原價 8800 → 8300 (Example: 百分比折扣有上限)", async () => {
		const coupon = await createTestCoupon({
			code: "SAVE20PCT",
			discountType: "percent",
			amountOff: null,
			percentOff: 20,
			maxDiscountAmount: 500,
		});

		const result = await validateCoupon(coupon.code, 8800);

		expect(result).toEqual({ valid: true, discountAmount: 500, finalAmount: 8300 });
	});

	it("不存在的 code 回 valid:false reason:not_found (Scenario: Nonexistent code returns 200 with not_found reason)", async () => {
		const result = await validateCoupon("NOSUCHCODE", 8800);

		expect(result).toEqual({ valid: false, reason: "not_found" });
	});

	it("已過期的 coupon 回 reason:expired (Scenario: Expired coupon is rejected)", async () => {
		const coupon = await createTestCoupon({
			code: "EXPIRED1",
			expiresAt: new Date(Date.now() - 60_000),
		});

		const result = await validateCoupon(coupon.code, 8800);

		expect(result).toEqual({ valid: false, reason: "expired" });
	});

	it("尚未生效的 coupon 回 reason:not_started (Scenario: Coupon not yet started is rejected)", async () => {
		const coupon = await createTestCoupon({
			code: "FUTURE1",
			startsAt: new Date(Date.now() + 60_000),
		});

		const result = await validateCoupon(coupon.code, 8800);

		expect(result).toEqual({ valid: false, reason: "not_started" });
	});

	it("已達使用上限的 coupon 回 reason:max_redemptions_reached (Scenario: Coupon at redemption limit is rejected)", async () => {
		const coupon = await createTestCoupon({
			code: "MAXEDOUT",
			maxRedemptions: 3,
			timesRedeemed: 3,
		});

		const result = await validateCoupon(coupon.code, 8800);

		expect(result).toEqual({ valid: false, reason: "max_redemptions_reached" });
	});

	it("code 比對不分大小寫（輸入小寫仍能命中大寫儲存的 code）", async () => {
		const coupon = await createTestCoupon({ code: "MIXEDCASE" });

		const result = await validateCoupon("mixedcase", 8800);

		expect(result).toEqual({ valid: true, discountAmount: 100, finalAmount: 8700 });
	});

	it("inactive 的 coupon 視同不存在，回 reason:not_found（避免用不同 reason 洩漏碼是否存在）", async () => {
		const coupon = await createTestCoupon({ code: "INACTIVE1", active: false });

		const result = await validateCoupon(coupon.code, 8800);

		expect(result).toEqual({ valid: false, reason: "not_found" });
	});
});
