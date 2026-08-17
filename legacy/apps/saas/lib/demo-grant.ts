import { createDatabase } from "@startkiter/database";
import { MVP_AMOUNT_TWD, MVP_CURRENCY, MVP_SKU } from "@startkiter/payments";
import { randomBytes } from "node:crypto";

/** 本機 Demo：給已登入使用者一筆 paid + courseAccess 訂單。flag 關則拒絕。 */
export async function grantDemoCourseAccess(userId: string) {
	if (process.env.DEMO_GRANT_COURSE !== "true") {
		throw new Error("demo_grant_disabled");
	}
	const db = createDatabase();
	const existing = await db.order.findFirst({
		where: { userId, sku: MVP_SKU, courseAccess: true },
	});
	if (existing) {
		return existing;
	}

	const orderNo = `SKDEMO${randomBytes(6).toString("hex")}`;
	return db.order.create({
		data: {
			orderNo,
			userId,
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: MVP_CURRENCY,
			status: "paid",
			paymentGateway: "payuni",
			gatewayTradeNo: `DEMO_${randomBytes(4).toString("hex")}`,
			courseAccess: true,
			kitClaimEligible: true,
			paidAt: new Date(),
		},
	});
}
