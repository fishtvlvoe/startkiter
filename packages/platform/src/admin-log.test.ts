import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		adminLog: {
			create: vi.fn(),
		},
	},
}));

import { db } from "@startkiter/database";

import { recordAdminAction } from "./admin-log";

describe("recordAdminAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.adminLog.create).mockResolvedValue({ id: "log-1" } as never);
	});

	it("records a refund against the order target", async () => {
		await recordAdminAction(
			"admin-1",
			"REFUND_ORDER",
			{ type: "Order", id: "order-1" },
			{ amount: 8800 },
			"203.0.113.10",
		);

		expect(db.adminLog.create).toHaveBeenCalledWith({
			data: {
				adminId: "admin-1",
				action: "REFUND_ORDER",
				targetType: "Order",
				targetId: "order-1",
				details: { amount: 8800 },
				ipAddress: "203.0.113.10",
			},
		});
	});

	it("records a course deletion and does not block the caller when persistence fails", async () => {
		vi.mocked(db.adminLog.create).mockRejectedValue(new Error("database unavailable"));

		await expect(
			recordAdminAction("admin-1", "DELETE_COURSE", { type: "Course", id: "course-1" }),
		).resolves.toBeUndefined();
		expect(db.adminLog.create).toHaveBeenCalledWith({
			data: {
				adminId: "admin-1",
				action: "DELETE_COURSE",
				targetType: "Course",
				targetId: "course-1",
				details: undefined,
				ipAddress: undefined,
			},
		});
	});
});
