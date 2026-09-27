import { db } from "@startkiter/database";
import { afterEach, describe, expect, it } from "vitest";

import { createCoupon, deactivateCoupon } from "./admin";

describe.sequential("packages/coupons createCoupon & deactivateCoupon (Task 1.1)", () => {
	const createdCouponIds: string[] = [];

	afterEach(async () => {
		for (const id of createdCouponIds.splice(0)) {
			await db.coupon.delete({ where: { id } }).catch(() => {});
		}
	});

	it("成功建立金額券：code trim 後轉大寫 (Scenario: Operator creates an amount coupon)", async () => {
		await db.coupon.deleteMany({ where: { code: "ADM_SAVE100" } });
		const result = await createCoupon({
			code: " adm_save100 ",
			discountType: "amount",
			amountOff: 100,
		});

		expect(result).toMatchObject({
			ok: true,
			code: "ADM_SAVE100",
		});
		if (result.ok) {
			createdCouponIds.push(result.id);
			const row = await db.coupon.findUnique({ where: { code: "ADM_SAVE100" } });
			expect(row).not.toBeNull();
			expect(row?.code).toBe("ADM_SAVE100");
			expect(row?.discountType).toBe("amount");
			expect(row?.amountOff).toBe(100);
			expect(row?.active).toBe(true);
		}
	});

	it("重複代碼不覆寫 (Scenario: Duplicate code does not overwrite)", async () => {
		await db.coupon.deleteMany({ where: { code: "DUPTEST" } });
		const first = await createCoupon({
			code: "DUPTEST",
			discountType: "amount",
			amountOff: 100,
		});
		expect(first.ok).toBe(true);
		if (first.ok) createdCouponIds.push(first.id);

		const second = await createCoupon({
			code: " duptest ",
			discountType: "amount",
			amountOff: 500,
		});

		expect(second).toEqual({
			ok: false,
			reason: "duplicate",
		});

		// 原列不變
		const row = await db.coupon.findUnique({ where: { code: "DUPTEST" } });
		expect(row?.amountOff).toBe(100);
	});

	it("空白代碼被拒絕 (Scenario: Empty code is rejected)", async () => {
		const result = await createCoupon({
			code: "   ",
			discountType: "amount",
			amountOff: 100,
		});

		expect(result).toEqual({
			ok: false,
			reason: "invalid",
		});
	});

	it("percent 為 0 或 101 被拒絕 (Scenario: Percent outside 1 to 100 is rejected)", async () => {
		const zero = await createCoupon({
			code: "PCT0",
			discountType: "percent",
			percentOff: 0,
		});
		expect(zero).toEqual({
			ok: false,
			reason: "invalid",
		});

		const over = await createCoupon({
			code: "PCT101",
			discountType: "percent",
			percentOff: 101,
		});
		expect(over).toEqual({
			ok: false,
			reason: "invalid",
		});
	});

	it("停用不存在的代碼回傳 not_found (Scenario: Missing coupon)", async () => {
		const result = await deactivateCoupon("NON_EXISTENT_CODE_XYZ");

		expect(result).toEqual({
			ok: false,
			reason: "not_found",
		});
	});

	it("成功停用優惠券：active 變為 false 且 timesRedeemed 不變 (Scenario: Active coupon becomes inactive)", async () => {
		await db.coupon.deleteMany({ where: { code: "DEACT1" } });
		const created = await createCoupon({
			code: "DEACT1",
			discountType: "amount",
			amountOff: 50,
		});
		expect(created.ok).toBe(true);
		if (created.ok) createdCouponIds.push(created.id);

		const deactResult = await deactivateCoupon("deact1");
		expect(deactResult).toEqual({ ok: true });

		const row = await db.coupon.findUnique({ where: { code: "DEACT1" } });
		expect(row?.active).toBe(false);
		expect(row?.timesRedeemed).toBe(0);

		// 再次停用已停用的券仍回成功
		const deactAgain = await deactivateCoupon("DEACT1");
		expect(deactAgain).toEqual({ ok: true });
	});
});
