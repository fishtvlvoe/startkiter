import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	insertNotification,
	isNotificationDisabled,
	getUserEmailLocaleForNotifications,
	sendEmail,
} = vi.hoisted(() => ({
	insertNotification: vi.fn(),
	isNotificationDisabled: vi.fn(),
	getUserEmailLocaleForNotifications: vi.fn(),
	sendEmail: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	insertNotification,
	isNotificationDisabled,
	getUserEmailLocaleForNotifications,
	NotificationTarget: { IN_APP: "IN_APP", EMAIL: "EMAIL" },
}));

vi.mock("@startkiter/mail", () => ({
	sendEmail,
}));

import { createNotification } from "./create-notification";

describe("createNotification", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NEXT_PUBLIC_SAAS_URL", "https://app.startkiter.test");
		isNotificationDisabled.mockResolvedValue(false);
		getUserEmailLocaleForNotifications.mockResolvedValue({
			email: "user@example.com",
			locale: "zh-tw",
		});
		sendEmail.mockResolvedValue(true);
		insertNotification.mockImplementation(async (input: {
			userId?: string;
			type?: string;
			data?: unknown;
			link?: string | null;
			read?: boolean;
		}) => {
			if (!input?.userId || !input?.type) {
				throw new Error("Missing required notification fields");
			}

			return {
				id: "notif-1",
				userId: input.userId,
				type: input.type,
				data: input.data ?? {},
				link: input.link ?? null,
				read: input.read ?? false,
				createdAt: new Date("2026-08-30T00:00:00.000Z"),
				updatedAt: new Date("2026-08-30T00:00:00.000Z"),
			};
		});
	});

	it("writes the notification row with user association and payload fields", async () => {
		const created = await createNotification({
			userId: "user-42",
			type: "WELCOME",
			data: { title: "Welcome!", message: "Hello" },
			link: "/inbox",
		});

		expect(insertNotification).toHaveBeenCalledWith({
			userId: "user-42",
			type: "WELCOME",
			data: { title: "Welcome!", message: "Hello" },
			link: "https://app.startkiter.test/inbox",
			read: false,
		});
		expect(created).toMatchObject({
			id: "notif-1",
			userId: "user-42",
			type: "WELCOME",
			read: false,
		});
	});

	it("rejects when required fields are missing", async () => {
		await expect(createNotification({} as never)).rejects.toThrow(
			"Missing required notification fields",
		);
		await expect(
			createNotification({ userId: "user-42" } as never),
		).rejects.toThrow("Missing required notification fields");
	});
});
