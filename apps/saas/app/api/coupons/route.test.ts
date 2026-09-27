import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/coupons", () => ({
	createCoupon: vi.fn(),
	deactivateCoupon: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { createCoupon, deactivateCoupon } from "@startkiter/coupons";
import { POST } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedCreateCoupon = vi.mocked(createCoupon);

function jsonRequest(body: unknown, path = "http://localhost/api/coupons") {
	return new Request(path, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/coupons (Requirement: Operator can create one coupon)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "admin@example.com";
	});

	afterEach(() => {
		delete process.env.ADMIN_EMAIL;
	});

	it("非營運人員呼叫回傳 403 (Scenario: Non-operator cannot create)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "instructor_1", email: "instructor@example.com", role: "user" },
			session: { id: "sess_1" },
		} as any);

		const response = await POST(jsonRequest({
			code: "SAVE100",
			discountType: "amount",
			amountOff: 100,
		}));

		expect(response.status).toBe(403);
		expect(mockedCreateCoupon).not.toHaveBeenCalled();
	});

	it("未登入呼叫回傳 401", async () => {
		mockedGetSession.mockResolvedValue(null as any);

		const response = await POST(jsonRequest({
			code: "SAVE100",
			discountType: "amount",
			amountOff: 100,
		}));

		expect(response.status).toBe(401);
		expect(mockedCreateCoupon).not.toHaveBeenCalled();
	});

	it("重複代碼回傳 409 (Scenario: Duplicate code does not overwrite)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: "admin@example.com", role: "admin" },
			session: { id: "sess_op" },
		} as any);

		mockedCreateCoupon.mockResolvedValue({
			ok: false,
			reason: "duplicate",
		});

		const response = await POST(jsonRequest({
			code: "DUPTEST",
			discountType: "amount",
			amountOff: 100,
		}));

		expect(response.status).toBe(409);
		const data = await response.json();
		expect(data).toHaveProperty("error");
	});

	it("空白代碼或格式錯誤回傳 400", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: "admin@example.com", role: "admin" },
			session: { id: "sess_op" },
		} as any);

		mockedCreateCoupon.mockResolvedValue({
			ok: false,
			reason: "invalid",
		});

		const response = await POST(jsonRequest({
			code: "",
			discountType: "amount",
			amountOff: 100,
		}));

		expect(response.status).toBe(400);
	});

	it("營運人員成功建立回傳 201 (Scenario: Operator creates an amount coupon)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: "admin@example.com", role: "admin" },
			session: { id: "sess_op" },
		} as any);

		mockedCreateCoupon.mockResolvedValue({
			ok: true,
			id: "c_123",
			code: "SAVE100",
		});

		const response = await POST(jsonRequest({
			code: " save100 ",
			discountType: "amount",
			amountOff: 100,
		}));

		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data).toMatchObject({ id: "c_123", code: "SAVE100" });
	});
});
