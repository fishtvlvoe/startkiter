import { db } from "@startkiter/database";

export type ValidateCouponResult =
	| { valid: true; discountAmount: number; finalAmount: number }
	| {
			valid: false;
			reason: "not_found" | "expired" | "not_started" | "max_redemptions_reached";
	  };

/**
 * 折扣計算與四種失敗分支（design.md Failure modes）。回傳一律 200 語意（valid:false + reason），
 * 呼叫端（API route）不得用 404 表示碼不存在，避免用狀態碼洩漏碼是否存在的枚舉線索。
 */
export async function validateCoupon(code: string, originalAmount: number): Promise<ValidateCouponResult> {
	const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

	if (!coupon || !coupon.active) {
		return { valid: false, reason: "not_found" };
	}

	const now = new Date();
	if (coupon.startsAt && coupon.startsAt > now) {
		return { valid: false, reason: "not_started" };
	}
	if (coupon.expiresAt && coupon.expiresAt < now) {
		return { valid: false, reason: "expired" };
	}
	if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
		return { valid: false, reason: "max_redemptions_reached" };
	}

	const rawDiscount =
		coupon.discountType === "percent"
			? Math.floor((originalAmount * (coupon.percentOff ?? 0)) / 100)
			: (coupon.amountOff ?? 0);
	const cappedDiscount =
		coupon.discountType === "percent" && coupon.maxDiscountAmount !== null
			? Math.min(rawDiscount, coupon.maxDiscountAmount)
			: rawDiscount;
	const discountAmount = Math.min(cappedDiscount, originalAmount);

	return { valid: true, discountAmount, finalAmount: originalAmount - discountAmount };
}
