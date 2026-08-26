import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		course: { findUnique: vi.fn() },
		courseWelcomeEmail: { findUnique: vi.fn() },
		emailDeliveryLog: { create: vi.fn(), update: vi.fn() },
		user: { findUnique: vi.fn() },
	},
}));

vi.mock("@startkiter/mail", () => ({
	renderCourseWelcomeEmail: vi.fn(),
	sendEmail: vi.fn(),
}));

import { db } from "@startkiter/database";
import { renderCourseWelcomeEmail, sendEmail } from "@startkiter/mail";

import { sendWelcomeEmail } from "./send-welcome-email";

describe("sendWelcomeEmail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.courseWelcomeEmail.findUnique).mockResolvedValue({
			courseId: "course-1",
			enabled: true,
			subjectTemplate: "歡迎 {{userName}} 加入 {{courseName}}",
			markdownTemplate: "請從 [課程入口]({{courseUrl}}) 開始。",
		} as never);
		vi.mocked(db.user.findUnique).mockResolvedValue({
			id: "user-1",
			name: "Fish",
			email: "fish@example.com",
			locale: "zh-tw",
		} as never);
		vi.mocked(db.course.findUnique).mockResolvedValue({
			id: "course-1",
			title: "開站包",
			slug: "startkiter",
		} as never);
		vi.mocked(db.emailDeliveryLog.create).mockResolvedValue({ id: "delivery-1" } as never);
		vi.mocked(db.emailDeliveryLog.update).mockResolvedValue({ id: "delivery-1", status: "SENT" } as never);
		vi.mocked(renderCourseWelcomeEmail).mockResolvedValue({
			html: "<p>請從 <a href=\"https://startkiter.test/course/startkiter\">課程入口</a> 開始。</p>",
			text: "請從課程入口開始。",
		});
		vi.mocked(sendEmail).mockResolvedValue(true);
	});

	it("sends an enabled welcome email and records SENT", async () => {
		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1", orderId: "order-1" });

		expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
			to: "fish@example.com",
			subject: "歡迎 Fish 加入 開站包",
			html: expect.any(String),
		}));
		expect(db.emailDeliveryLog.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({
				type: "WELCOME_EMAIL",
				status: "PENDING",
				orderId: "order-1",
				userId: "user-1",
				courseId: "course-1",
			}),
		}));
		expect(db.emailDeliveryLog.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: "SENT", sentAt: expect.any(Date) }),
		}));
	});

	it.each([
		["disabled", { enabled: false }],
		["unconfigured", null],
	])("does not send when welcome email is %s", async (_label, setting) => {
		vi.mocked(db.courseWelcomeEmail.findUnique).mockResolvedValue(setting as never);

		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1" });

		expect(sendEmail).not.toHaveBeenCalled();
		expect(db.emailDeliveryLog.create).not.toHaveBeenCalled();
	});

	it("records FAILED when the mail provider rejects the message", async () => {
		vi.mocked(sendEmail).mockResolvedValue(false);

		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1" });

		expect(db.emailDeliveryLog.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: "FAILED", errorMessage: expect.any(String) }),
		}));
	});
});
