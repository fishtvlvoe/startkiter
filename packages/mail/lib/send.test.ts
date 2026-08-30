import { afterEach, describe, expect, it, vi } from "vitest";

const { resendSend } = vi.hoisted(() => ({
	resendSend: vi.fn(),
}));

vi.mock("resend", () => ({
	Resend: class Resend {
		emails = { send: resendSend };
	},
}));

describe("sendEmail", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		resendSend.mockReset();
	});

	it("selects the console provider outside production when RESEND_API_KEY is missing", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("NODE_ENV", "development");

		const { sendEmail } = await import("./send");
		const ok = await sendEmail({
			to: "learner@example.com",
			subject: "Dev fallback",
			text: "Logged locally.",
		});

		expect(ok).toBe(true);
		expect(resendSend).not.toHaveBeenCalled();
	});

	it("selects Resend when RESEND_API_KEY is set", async () => {
		resendSend.mockResolvedValue({ id: "email-1" });
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("MAIL_FROM", "StartKiter <noreply@startkiter.test>");

		const { sendEmail } = await import("./send");
		const ok = await sendEmail({
			to: "learner@example.com",
			subject: "Prod send",
			text: "Delivered by Resend.",
			html: "<p>Delivered by Resend.</p>",
		});

		expect(ok).toBe(true);
		expect(resendSend).toHaveBeenCalledWith(
			expect.objectContaining({
				to: ["learner@example.com"],
				subject: "Prod send",
				text: "Delivered by Resend.",
			}),
		);
	});

	it("returns false when required send fields are missing and the provider rejects", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("NODE_ENV", "production");

		const { sendEmail } = await import("./send");
		const ok = await sendEmail({
			to: "",
			subject: "",
			text: "",
		} as never);

		expect(ok).toBe(false);
	});
});
