/** 對應 `packages/database` 的 `Coupon` Prisma model（design.md Implementation Contract）。 */
export type Coupon = {
	id: string;
	/** 大寫，唯一。 */
	code: string;
	discountType: "amount" | "percent";
	/** discountType === "amount" 時必填。 */
	amountOff: number | null;
	/** discountType === "percent" 時必填，1-100。 */
	percentOff: number | null;
	/** percent 折扣的金額上限，選填。 */
	maxDiscountAmount: number | null;
	/** null 或 0 = 無限。 */
	maxRedemptions: number | null;
	timesRedeemed: number;
	active: boolean;
	/** ISO datetime，null = 立即生效。 */
	startsAt: string | null;
	/** ISO datetime，null = 永不到期。 */
	expiresAt: string | null;
};
