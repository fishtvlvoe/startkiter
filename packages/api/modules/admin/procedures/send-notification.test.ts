import { call, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique: vi.fn() },
		notification: { create: vi.fn() },
	},
}));

vi.mock("@startkiter/notifications", () => ({
	createNotification: vi.fn(),
	createWelcomeNotification: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { createNotification, createWelcomeNotification } from "@startkiter/notifications";

import { sendNotification } from "./send-notification";

const context = { context: { headers: new Headers() } };

describe("admin.notifications.send (Task 3.1 / Requirement: Operator can send one APP_UPDATE notification to an existing user)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-admin", userId: "admin-1" },
			user: { id: "admin-1", email: "admin@example.com", role: "admin" },
		} as never);
		vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);
	});

	it("非營運人員呼叫被拒絕 (403 FORBIDDEN)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-user", userId: "user-1" },
			user: { id: "user-1", email: "user@example.com", role: "user" },
		} as never);

		await expect(
			call(sendNotification, { userId: "user-1", title: "測試", message: "內文" }, context),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(createNotification).not.toHaveBeenCalled();
	});

	it("目標使用者不存在時回傳 404 (NOT_FOUND)", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValue(null as never);

		await expect(
			call(sendNotification, { userId: "missing_user", title: "測試", message: "內文" }, context),
		).rejects.toMatchObject({ code: "NOT_FOUND" });

		expect(createNotification).not.toHaveBeenCalled();
	});

	it("標題超過 120 字被拒絕 (400 BAD_REQUEST)", async () => {
		const longTitle = "a".repeat(121);

		await expect(
			call(sendNotification, { userId: "user-1", title: longTitle, message: "內文" }, context),
		).rejects.toThrow();

		expect(createNotification).not.toHaveBeenCalled();
	});

	it("內文超過 500 字被拒絕 (400 BAD_REQUEST)", async () => {
		const longMessage = "a".repeat(501);

		await expect(
			call(sendNotification, { userId: "user-1", title: "測試", message: longMessage }, context),
		).rejects.toThrow();

		expect(createNotification).not.toHaveBeenCalled();
	});

	it("站內偏好關閉時，回傳 created: false 且不插入通知", async () => {
		// createNotification 在站內偏好關閉時回傳 null
		vi.mocked(createNotification).mockResolvedValue(null as never);

		const result = await call(
			sendNotification,
			{ userId: "user-1", title: "維護通知", message: "今晚更新" },
			context,
		);

		expect(result).toEqual({ created: false });
		expect(createNotification).toHaveBeenCalledWith({
			userId: "user-1",
			type: "APP_UPDATE",
			data: { title: "維護通知", message: "今晚更新" },
		});
		// 確認沒有呼叫 createWelcomeNotification
		expect(createWelcomeNotification).not.toHaveBeenCalled();
	});

	it("偏好允許時，回傳 created: true 與 id，且類型為 APP_UPDATE", async () => {
		vi.mocked(createNotification).mockResolvedValue({
			id: "notif-123",
			userId: "user-1",
			type: "APP_UPDATE",
			read: false,
		} as never);

		const result = await call(
			sendNotification,
			{ userId: "user-1", title: "維護通知", message: "今晚更新" },
			context,
		);

		expect(result).toEqual({ created: true, id: "notif-123" });
		expect(createNotification).toHaveBeenCalledWith({
			userId: "user-1",
			type: "APP_UPDATE",
			data: { title: "維護通知", message: "今晚更新" },
		});
	});
});
