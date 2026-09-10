import { call, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: { findUnique: vi.fn() },
		courseWelcomeEmail: { findUnique: vi.fn() },
		emailDeliveryLog: { create: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
	},
}));

vi.mock("@startkiter/mail", () => ({
	renderCourseWelcomeEmail: vi.fn(),
	sendEmail: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { renderCourseWelcomeEmail, sendEmail } from "@startkiter/mail";

import { sendWelcomeEmailTest } from "./send-welcome-email-test";

describe("sendWelcomeEmailTest", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEXT_PUBLIC_SAAS_URL = "https://app.startkiter.dev";
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "operator-1", email: "operator@example.com", role: "user" },
			session: { id: "session-1", userId: "operator-1" },
		} as never);
		vi.mocked(db.course.findUnique).mockResolvedValue({
			id: "course-1",
			title: "開站包",
			slug: "startkiter",
		} as never);
		vi.mocked(db.courseWelcomeEmail.findUnique).mockResolvedValue({
			courseId: "course-1",
			enabled: true,
			subjectTemplate: "歡迎 {{userName}} 加入 {{courseName}}",
			markdownTemplate: "請從課程入口開始。",
			contentJson: null,
		} as never);
		vi.mocked(renderCourseWelcomeEmail).mockResolvedValue({
			html: "<p>測試內文</p>",
			text: "測試內文",
		});
		vi.mocked(sendEmail).mockResolvedValue(true);
		vi.mocked(db.emailDeliveryLog.create).mockResolvedValue({ id: "should-not-exist" } as never);
		vi.mocked(db.emailDeliveryLog.count).mockResolvedValue(0);
	});

	it("sends a test email and returns ok/toEmail/subject without writing delivery logs", async () => {
		const result = await call(
			sendWelcomeEmailTest,
			{ courseId: "course-1", toEmail: "fish@example.com" },
			{ context: { headers: new Headers() } },
		);

		expect(result).toEqual({
			ok: true,
			toEmail: "fish@example.com",
			subject: "歡迎 測試學員 加入 開站包",
		});
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "fish@example.com",
				subject: "歡迎 測試學員 加入 開站包",
				html: "<p>測試內文</p>",
				text: "測試內文",
			}),
		);
		expect(renderCourseWelcomeEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				userName: "測試學員",
				courseName: "開站包",
			}),
		);
		expect(db.emailDeliveryLog.create).not.toHaveBeenCalled();
	});

	it("rejects empty toEmail without sending", async () => {
		await expect(
			call(
				sendWelcomeEmailTest,
				{ courseId: "course-1", toEmail: "" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toBeTruthy();

		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("rejects non-email toEmail without sending", async () => {
		await expect(
			call(
				sendWelcomeEmailTest,
				{ courseId: "course-1", toEmail: "not-an-email" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toBeTruthy();

		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("rejects non-admin callers", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user-2", email: "learner@example.com", role: "user" },
			session: { id: "session-2", userId: "user-2" },
		} as never);

		await expect(
			call(
				sendWelcomeEmailTest,
				{ courseId: "course-1", toEmail: "fish@example.com" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toBeInstanceOf(ORPCError);

		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("fails when the course has no welcome email template", async () => {
		vi.mocked(db.courseWelcomeEmail.findUnique).mockResolvedValue(null);

		await expect(
			call(
				sendWelcomeEmailTest,
				{ courseId: "course-1", toEmail: "fish@example.com" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toThrow(/welcome email template|歡迎信/i);

		expect(sendEmail).not.toHaveBeenCalled();
	});

	it("surfaces the provider error message when delivery is rejected", async () => {
		vi.mocked(sendEmail).mockImplementation(async (args: { onError?: (error: unknown) => void }) => {
			args.onError?.(new Error("SMTP 550 mailbox unavailable"));
			return false;
		});

		await expect(
			call(
				sendWelcomeEmailTest,
				{ courseId: "course-1", toEmail: "fish@example.com" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toThrow(/550 mailbox unavailable/);

		expect(db.emailDeliveryLog.create).not.toHaveBeenCalled();
	});
});
