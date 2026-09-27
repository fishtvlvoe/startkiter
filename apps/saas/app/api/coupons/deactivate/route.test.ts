import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/coupons", () => ({
	deactivateCoupon: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { deactivateCoupon } from "@startkiter/coupons";
import { POST } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedDeactivateCoupon = vi.mocked(deactivateCoupon);

function jsonRequest(body: unknown) {
	return new Request("http://localhost/api/coupons/deactivate", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/coupons/deactivate (Requirement: Operator can deactivate a coupon without deleting it)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "admin@example.com";
	});

	afterEach(() => {
		delete process.env.ADMIN_EMAIL;
	});

	it("非營運人員呼叫回傳 403", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "instructor_1", email: "instructor@example.com", role: "user" },
			session: { id: "sess_1" },
		} as any);

		const response = await POST(jsonRequest({ code: "SAVE100" }));

		expect(response.status).toBe(403);
		expect(mockedDeactivateCoupon).not.toHaveBeenCalled();
	});

	it("代碼不存在回傳 404 (Scenario: Missing coupon)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: "admin@example.com", role: "admin" },
			session: { id: "sess_op" },
		} as any);

		mockedDeactivateCoupon.mockResolvedValue({
			ok: false,
			reason: "not_found",
		});

		const response = await POST(jsonRequest({ code: "NOTEXIST" }));

		expect(response.status).toBe(404);
	});

	it("營運人員成功停用回傳 200 (Scenario: Active coupon becomes inactive)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: "admin@example.com", role: "admin" },
			session: { id: "sess_op" },
		} as any);

		mockedDeactivateCoupon.mockResolvedValue({
			ok: true,
		});

		const response = await POST(jsonRequest({ code: "SAVE100" }));

		expect(response.status).toBe(200);
	});
});
