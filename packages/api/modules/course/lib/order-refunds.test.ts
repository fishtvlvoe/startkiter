import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		order: { updateMany: vi.fn() },
	},
}));

import { db } from "@startkiter/database";
import { markOrderRefundedById, markOrderRefundedByOrderNo } from "./order-refunds";

describe("order refund persistence", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.order.updateMany).mockResolvedValue({ count: 1 } as never);
	});

	it("marks a refundable order by id and revokes both access flags", async () => {
		await expect(markOrderRefundedById("order-1")).resolves.toBe(1);

		expect(db.order.updateMany).toHaveBeenCalledWith({
			where: { id: "order-1", status: { in: ["pending", "paid"] } },
			data: {
				status: "refunded",
				courseAccess: false,
				kitClaimEligible: false,
				refundedAt: expect.any(Date),
			},
		});
	});

	it("keeps the legacy order-number refund path available", async () => {
		await expect(markOrderRefundedByOrderNo("SK-1")).resolves.toBe(1);

		expect(db.order.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { orderNo: "SK-1", status: { in: ["pending", "paid"] } } }),
		);
	});
});
