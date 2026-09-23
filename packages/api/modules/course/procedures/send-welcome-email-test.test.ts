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

	it("does not Markdown-escape punctuation in the plain-text subject", async () => {
		vi.mocked(db.course.findUnique).mockResolvedValue({
			id: "course-1",
			title: "(StartKiter Academy)",
			slug: "startkiter",
		} as never);
		vi.mocked(db.courseWelcomeEmail.findUnique).mockResolvedValue({
			courseId: "course-1",
			enabled: true,
			subjectTemplate: "{{courseName}}",
			markdownTemplate: "請從課程入口開始。",
			contentJson: null,
		} as never);

		const result = await call(
			sendWelcomeEmailTest,
			{ courseId: "course-1", toEmail: "fish@example.com" },
			{ context: { headers: new Headers() } },
		);

		expect(result.subject).toBe("(StartKiter Academy)");
		expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: "(StartKiter Academy)" }));
	});

	it("sends rendered HTML for a legacy Markdown template", async () => {
		const actualMail = await vi.importActual<typeof import("@startkiter/mail")>("@startkiter/mail");
		vi.mocked(renderCourseWelcomeEmail).mockImplementation(actualMail.renderCourseWelcomeEmail);
		vi.mocked(db.courseWelcomeEmail.findUnique).mockResolvedValue({
			courseId: "course-1",
			enabled: true,
			subjectTemplate: "歡迎 {{courseName}}",
			markdownTemplate: "**電馭學院**\n\n[開始上課](https://app.startkiter.dev/course/startkiter)",
			contentJson: null,
		} as never);

		await call(
			sendWelcomeEmailTest,
			{ courseId: "course-1", toEmail: "fish@example.com" },
			{ context: { headers: new Headers() } },
		);

		const calls = vi.mocked(sendEmail).mock.calls;
		const sentEmail = calls[calls.length - 1]?.[0];
		expect(sentEmail?.html).toMatch(/<strong(?:\s[^>]*)?>電馭學院<\/strong>/);
		expect(sentEmail?.html).toMatch(
			/<a href="https:\/\/app\.startkiter\.dev\/course\/startkiter"[^>]*>開始上課<\/a>/,
		);
		expect(sentEmail?.html).not.toContain("**電馭學院**");
		expect(sentEmail?.html).not.toContain("[開始上課](https://app.startkiter.dev/course/startkiter)");
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

	it("mock end-to-end: contentJson blocks render into html/text with CTA and still skip delivery logs", async () => {
		const contentJson = JSON.stringify([
			{
				type: "heading",
				props: { level: 1 },
				content: [{ type: "text", text: "歡迎上船", styles: {} }],
			},
			{
				type: "paragraph",
				content: [{ type: "text", text: "這是測資段落。", styles: {} }],
			},
			{
				type: "button",
				props: { text: "開始上課", url: "https://app.startkiter.dev/course/startkiter" },
			},
		]);

		vi.mocked(db.courseWelcomeEmail.findUnique).mockResolvedValue({
			courseId: "course-1",
			enabled: true,
			subjectTemplate: "歡迎 {{userName}} 加入 {{courseName}}",
			markdownTemplate: "舊 markdown 不應被 contentJson 路徑當主來源",
			contentJson,
		} as never);
		vi.mocked(renderCourseWelcomeEmail).mockResolvedValue({
			html: '<h1>歡迎上船</h1><p>這是測資段落。</p><a href="https://app.startkiter.dev/course/startkiter">開始上課</a>',
			text: "歡迎上船\n\n這是測資段落。\n\n開始上課 (https://app.startkiter.dev/course/startkiter)",
		});

		const result = await call(
			sendWelcomeEmailTest,
			{ courseId: "course-1", toEmail: "gmail-standin@example.com" },
			{ context: { headers: new Headers() } },
		);

		expect(result).toEqual({
			ok: true,
			toEmail: "gmail-standin@example.com",
			subject: "歡迎 測試學員 加入 開站包",
		});
		expect(renderCourseWelcomeEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				userName: "測試學員",
				courseName: "開站包",
				contentJson,
				courseUrl: "https://app.startkiter.dev/course/startkiter",
				subject: "歡迎 測試學員 加入 開站包",
			}),
		);
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "gmail-standin@example.com",
				locale: "zh-tw",
				subject: "歡迎 測試學員 加入 開站包",
				html: expect.stringContaining("開始上課"),
				text: expect.stringContaining("開始上課 (https://app.startkiter.dev/course/startkiter)"),
			}),
		);
		expect(db.emailDeliveryLog.create).not.toHaveBeenCalled();
		expect(db.emailDeliveryLog.count).not.toHaveBeenCalled();
	});
});
