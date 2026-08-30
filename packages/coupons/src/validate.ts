import { db, type Prisma } from "@startkiter/database";

export type ValidateCouponResult =
	| { valid: true; discountAmount: number; finalAmount: number }
	| {
			valid: false;
			reason: "not_found" | "expired" | "not_started" | "max_redemptions_reached";
	  };

export type RedeemCouponResult =
	| {
			ok: true;
			couponId: string;
			couponCode: string;
			discountAmount: number;
			finalAmount: number;
	  }
	| {
			ok: false;
			reason: "not_found" | "expired" | "not_started" | "max_redemptions_reached";
	  };

type CouponRow = {
	id: string;
	code: string;
	discountType: string;
	amountOff: number | null;
	percentOff: number | null;
	maxDiscountAmount: number | null;
	maxRedemptions: number | null;
	timesRedeemed: number;
	active: boolean;
	startsAt: Date | null;
	expiresAt: Date | null;
};

function normalizeCouponCode(code: string): string {
	return code.trim().toUpperCase();
}

function evaluateCoupon(coupon: CouponRow | null, originalAmount: number): ValidateCouponResult {
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

/**
 * 折扣計算與四種失敗分支（design.md Failure modes）。回傳一律 200 語意（valid:false + reason），
 * 呼叫端（API route）不得用 404 表示碼不存在，避免用狀態碼洩漏碼是否存在的枚舉線索。
 */
export async function validateCoupon(code: string, originalAmount: number): Promise<ValidateCouponResult> {
	const coupon = await db.coupon.findUnique({ where: { code: normalizeCouponCode(code) } });
	return evaluateCoupon(coupon, originalAmount);
}

/**
 * 在既有 DB transaction 內悲觀鎖 coupon 列、檢查兌換上限、原子遞增 timesRedeemed。
 * checkout 建立訂單必須與此同一 transaction，避免並行超過 maxRedemptions。
 */
export async function redeemCouponInTransaction(
	tx: Prisma.TransactionClient,
	code: string,
	originalAmount: number,
): Promise<RedeemCouponResult> {
	const normalized = normalizeCouponCode(code);

	await tx.$executeRaw`SELECT 1 FROM "Coupon" WHERE code = ${normalized} FOR UPDATE`;

	const coupon = await tx.coupon.findUnique({ where: { code: normalized } });
	const evaluated = evaluateCoupon(coupon, originalAmount);
	if (!evaluated.valid) {
		return { ok: false, reason: evaluated.reason };
	}
	if (!coupon) {
		return { ok: false, reason: "not_found" };
	}

	await tx.coupon.update({
		where: { id: coupon.id },
		data: { timesRedeemed: { increment: 1 } },
	});

	return {
		ok: true,
		couponId: coupon.id,
		couponCode: coupon.code,
		discountAmount: evaluated.discountAmount,
		finalAmount: evaluated.finalAmount,
	};
}
