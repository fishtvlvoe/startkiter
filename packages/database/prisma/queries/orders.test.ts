import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({
	db: {
		member: { findMany: vi.fn() },
		order: { findMany: vi.fn(), findFirst: vi.fn() },
	},
}));

import { db } from "../client";
import { getCourseAccessOrdersForUser, getEligibleKitOrderForUser } from "./orders";

describe("getCourseAccessOrdersForUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("unions personal and organization course-access orders", async () => {
		vi.mocked(db.member.findMany).mockResolvedValueOnce([
			{ organizationId: "organization-1" },
		] as never);
		vi.mocked(db.order.findMany).mockResolvedValueOnce([
			{ sku: "startkiter-mvp", courseAccess: true },
		] as never);

		await expect(getCourseAccessOrdersForUser("user-1")).resolves.toEqual([
			{ sku: "startkiter-mvp", courseAccess: true },
		]);

		expect(db.member.findMany).toHaveBeenCalledWith({
			where: { userId: "user-1" },
			select: { organizationId: true },
		});
		expect(db.order.findMany).toHaveBeenCalledWith({
			where: {
				courseAccess: true,
				OR: [
					{ userId: "user-1" },
					{ organizationId: { in: ["organization-1"] } },
				],
			},
			select: { sku: true, courseAccess: true },
		});
	});

	it("inherits kit eligibility from the member's organization", async () => {
		vi.mocked(db.member.findMany).mockResolvedValueOnce([
			{ organizationId: "organization-1" },
		] as never);
		vi.mocked(db.order.findFirst).mockResolvedValueOnce({ id: "order-1", orderNo: "SK-1" } as never);

		await expect(getEligibleKitOrderForUser("user-1", "startkiter-mvp")).resolves.toEqual({
			id: "order-1",
			orderNo: "SK-1",
		});

		expect(db.order.findFirst).toHaveBeenCalledWith({
			where: {
				sku: "startkiter-mvp",
				kitClaimEligible: true,
				OR: [
					{ userId: "user-1" },
					{ organizationId: { in: ["organization-1"] } },
				],
			},
			select: { id: true, orderNo: true },
		});
	});
});
