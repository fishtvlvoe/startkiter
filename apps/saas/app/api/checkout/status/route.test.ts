import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@startkiter/database", () => ({
	db: { order: { findFirst: vi.fn() } },
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { GET } from "./route";

describe("checkout order status", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns only the signed-in user's order status", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-1" } } as never);
		vi.mocked(db.order.findFirst).mockResolvedValue({ status: "paid" } as never);

		const response = await GET(new Request("http://localhost:3000/api/checkout/status?orderNo=ORDER-1"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ orderNo: "ORDER-1", status: "paid" });
		expect(db.order.findFirst).toHaveBeenCalledWith({
			where: { orderNo: "ORDER-1", userId: "user-1" },
			select: { status: true },
		});
	});

	it("does not reveal whether an order belongs to another user", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-1" } } as never);
		vi.mocked(db.order.findFirst).mockResolvedValue(null);

		const response = await GET(new Request("http://localhost:3000/api/checkout/status?orderNo=ORDER-2"));

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "order_not_found" });
	});
});
