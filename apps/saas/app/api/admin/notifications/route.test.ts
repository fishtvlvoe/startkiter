import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique: vi.fn() },
	},
}));
vi.mock("@startkiter/notifications", () => ({
	createNotification: vi.fn(),
	createWelcomeNotification: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { createNotification } from "@startkiter/notifications";
import { POST } from "./route";

function jsonRequest(body: unknown) {
	return new Request("http://localhost/api/admin/notifications", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/admin/notifications (Requirement: Operator can send one APP_UPDATE notification to an existing user)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "admin@example.com";
	});

	afterEach(() => {
		delete process.env.ADMIN_EMAIL;
	});

	it("未登入呼叫回傳 401", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);
		const response = await POST(jsonRequest({ userId: "u1", title: "標題", message: "內文" }));
		expect(response.status).toBe(401);
	});

	it("非營運人員呼叫回傳 403 (Scenario: Non-operator is rejected)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "u-instructor", role: "user", email: "inst@example.com" },
		} as any);
		const response = await POST(jsonRequest({ userId: "u1", title: "標題", message: "內文" }));
		expect(response.status).toBe(403);
	});

	it("目標使用者不存在回傳 404 (Scenario: Unknown user)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin", email: "admin@example.com" },
		} as any);
		vi.mocked(db.user.findUnique).mockResolvedValue(null);

		const response = await POST(jsonRequest({ userId: "missing_user", title: "標題", message: "內文" }));
		expect(response.status).toBe(404);
	});

	it("標題超過 120 字回傳 400", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin", email: "admin@example.com" },
		} as any);
		vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1" } as any);

		const response = await POST(jsonRequest({ userId: "u1", title: "a".repeat(121), message: "內文" }));
		expect(response.status).toBe(400);
	});

	it("站內偏好關閉時回傳 200 且 created: false (Scenario: In-app preference blocks the insert)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin", email: "admin@example.com" },
		} as any);
		vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1" } as any);
		vi.mocked(createNotification).mockResolvedValue(null as any);

		const response = await POST(jsonRequest({ userId: "u1", title: "維護通知", message: "今晚更新" }));
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toEqual({ created: false });
	});

	it("允許時回傳 201 且 created: true (Scenario: Operator sends an update)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin", email: "admin@example.com" },
		} as any);
		vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1" } as any);
		vi.mocked(createNotification).mockResolvedValue({ id: "n1", type: "APP_UPDATE" } as any);

		const response = await POST(jsonRequest({ userId: "u1", title: "維護通知", message: "今晚更新" }));
		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data).toMatchObject({ created: true, id: "n1" });
	});
});
