import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		course: { findUnique: vi.fn() },
		courseWelcomeEmail: { findUnique: vi.fn() },
		emailDeliveryLog: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
		$executeRaw: vi.fn(),
		$transaction: vi.fn(),
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
		vi.mocked(db.$executeRaw).mockResolvedValue(0);
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(db as never) as never);
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
		vi.mocked(db.emailDeliveryLog.findFirst).mockResolvedValue(null);
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

	it("reuses a previous failed delivery when a paid webhook is replayed", async () => {
		vi.mocked(db.emailDeliveryLog.findFirst).mockResolvedValue({ id: "delivery-1", status: "FAILED" } as never);

		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1", orderId: "order-1" });

		expect(db.emailDeliveryLog.create).not.toHaveBeenCalled();
		expect(db.emailDeliveryLog.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "delivery-1" },
			data: expect.objectContaining({ status: "PENDING", errorMessage: null }),
		}));
		expect(sendEmail).toHaveBeenCalledTimes(1);
	});

	it("does not send a duplicate when the previous delivery is already SENT", async () => {
		vi.mocked(db.emailDeliveryLog.findFirst).mockResolvedValue({ id: "delivery-1", status: "SENT" } as never);

		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1", orderId: "order-1" });

		expect(sendEmail).not.toHaveBeenCalled();
		expect(db.emailDeliveryLog.create).not.toHaveBeenCalled();
	});

	it("does not send concurrently when a previous delivery is still pending", async () => {
		vi.mocked(db.emailDeliveryLog.findFirst).mockResolvedValue({
			id: "delivery-1",
			status: "PENDING",
			createdAt: new Date(Date.now() - 60_000),
		} as never);

		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1", orderId: "order-1" });

		expect(sendEmail).not.toHaveBeenCalled();
		expect(db.emailDeliveryLog.create).not.toHaveBeenCalled();
		expect(db.emailDeliveryLog.update).not.toHaveBeenCalled();
	});

	it("retries a pending delivery after its reservation TTL expires", async () => {
		vi.mocked(db.emailDeliveryLog.findFirst).mockResolvedValue({
			id: "delivery-1",
			status: "PENDING",
			createdAt: new Date(Date.now() - 16 * 60_000),
		} as never);

		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1", orderId: "order-1" });

		expect(db.emailDeliveryLog.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: "delivery-1" },
			data: expect.objectContaining({ status: "PENDING", errorMessage: null }),
		}));
		expect(sendEmail).toHaveBeenCalledTimes(1);
	});

	it("refreshes the lease so concurrent expired retries send only once", async () => {
		let current = {
			id: "delivery-1",
			status: "PENDING",
			createdAt: new Date(Date.now() - 16 * 60_000),
		};
		vi.mocked(db.emailDeliveryLog.findFirst).mockImplementation((async () => current as never) as never);
		vi.mocked(db.emailDeliveryLog.update).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => {
			current = { ...current, ...data } as typeof current;
			return current as never;
		}) as never);

		let release!: () => void;
		const sendStarted = new Promise<void>((resolve) => {
			vi.mocked(sendEmail).mockImplementationOnce(async () => {
				resolve();
				await new Promise<void>((done) => { release = done; });
				return true;
			});
		});

		const first = sendWelcomeEmail({ userId: "user-1", courseId: "course-1", orderId: "order-1" });
		await sendStarted;
		await sendWelcomeEmail({ userId: "user-1", courseId: "course-1", orderId: "order-1" });
		release();
		await first;

		expect(sendEmail).toHaveBeenCalledTimes(1);
		expect(current.createdAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
	});
});
