import { db } from "@startkiter/database";

export type CreateCouponInput = {
	code: string;
	discountType: "amount" | "percent";
	amountOff?: number | null;
	percentOff?: number | null;
	maxDiscountAmount?: number | null;
	maxRedemptions?: number | null;
	startsAt?: Date | null;
	expiresAt?: Date | null;
};

export type CreateCouponResult =
	| { ok: true; id: string; code: string }
	| { ok: false; reason: "invalid" | "duplicate" };

export type DeactivateCouponResult =
	| { ok: true }
	| { ok: false; reason: "not_found" };

function normalizeCode(code: string): string {
	return code.trim().toUpperCase();
}

/**
 * 營運人員建立優惠券。代碼先 trim 再轉大寫，重複代碼不覆寫。
 */
export async function createCoupon(input: CreateCouponInput): Promise<CreateCouponResult> {
	if (!input.code || typeof input.code !== "string") {
		return { ok: false, reason: "invalid" };
	}

	const normalizedCode = normalizeCode(input.code);
	if (!normalizedCode) {
		return { ok: false, reason: "invalid" };
	}

	if (input.discountType !== "amount" && input.discountType !== "percent") {
		return { ok: false, reason: "invalid" };
	}

	if (input.discountType === "amount") {
		if (
			typeof input.amountOff !== "number" ||
			!Number.isInteger(input.amountOff) ||
			input.amountOff <= 0
		) {
			return { ok: false, reason: "invalid" };
		}
	} else if (input.discountType === "percent") {
		if (
			typeof input.percentOff !== "number" ||
			!Number.isInteger(input.percentOff) ||
			input.percentOff < 1 ||
			input.percentOff > 100
		) {
			return { ok: false, reason: "invalid" };
		}
	}

	const existing = await db.coupon.findUnique({
		where: { code: normalizedCode },
	});

	if (existing) {
		return { ok: false, reason: "duplicate" };
	}

	try {
		const coupon = await db.coupon.create({
			data: {
				code: normalizedCode,
				discountType: input.discountType,
				amountOff: input.discountType === "amount" ? input.amountOff : null,
				percentOff: input.discountType === "percent" ? input.percentOff : null,
				maxDiscountAmount: input.maxDiscountAmount ?? null,
				maxRedemptions: input.maxRedemptions ?? null,
				startsAt: input.startsAt ?? null,
				expiresAt: input.expiresAt ?? null,
				active: true,
			},
		});

		return { ok: true, id: coupon.id, code: coupon.code };
	} catch (error: any) {
		if (error?.code === "P2002") {
			return { ok: false, reason: "duplicate" };
		}
		throw error;
	}
}

/**
 * 營運人員停用優惠券。只把 active 設為 false，不刪除、不變更 timesRedeemed。
 */
export async function deactivateCoupon(code: string): Promise<DeactivateCouponResult> {
	if (!code || typeof code !== "string") {
		return { ok: false, reason: "not_found" };
	}

	const normalizedCode = normalizeCode(code);
	if (!normalizedCode) {
		return { ok: false, reason: "not_found" };
	}

	const existing = await db.coupon.findUnique({
		where: { code: normalizedCode },
	});

	if (!existing) {
		return { ok: false, reason: "not_found" };
	}

	await db.coupon.update({
		where: { id: existing.id },
		data: { active: false },
	});

	return { ok: true };
}
