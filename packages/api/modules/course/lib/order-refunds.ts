import { db } from "@startkiter/database";

const refundableStatuses = ["pending", "paid"] as const;

export async function markOrderRefundedById(orderId: string): Promise<number> {
	const result = await db.order.updateMany({
		where: { id: orderId, status: { in: [...refundableStatuses] } },
		data: {
			status: "refunded",
			courseAccess: false,
			kitClaimEligible: false,
			refundedAt: new Date(),
		},
	});
	return result.count;
}

export async function markOrderRefundedByOrderNo(orderNo: string): Promise<number> {
	const result = await db.order.updateMany({
		where: { orderNo, status: { in: [...refundableStatuses] } },
		data: {
			status: "refunded",
			courseAccess: false,
			kitClaimEligible: false,
			refundedAt: new Date(),
		},
	});
	return result.count;
}
