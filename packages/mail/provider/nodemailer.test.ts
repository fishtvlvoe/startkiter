import { afterEach, describe, expect, it, vi } from "vitest";

const { createTransport, sendMail } = vi.hoisted(() => {
	const sendMail = vi.fn().mockResolvedValue({ messageId: "smtp-1" });
	const createTransport = vi.fn(() => ({ sendMail }));
	return { createTransport, sendMail };
});

vi.mock("nodemailer", () => ({
	default: { createTransport },
}));

describe("SMTP provider connection configuration", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
		createTransport.mockClear();
		sendMail.mockClear();
	});

	it("reads SMTP_HOST/PORT/USER/PASS/SECURE and treats only literal true as secure", async () => {
		vi.stubEnv("SMTP_HOST", "smtp.example.com");
		vi.stubEnv("SMTP_PORT", "465");
		vi.stubEnv("SMTP_USER", "user");
		vi.stubEnv("SMTP_PASS", "pass");
		vi.stubEnv("SMTP_SECURE", "true");

		const { send } = await import("./nodemailer");
		await send({
			to: "learner@example.com",
			subject: "SMTP",
			text: "Body",
		});

		expect(createTransport).toHaveBeenCalledWith({
			host: "smtp.example.com",
			port: 465,
			secure: true,
			auth: {
				user: "user",
				pass: "pass",
			},
		});
	});

	it("treats SMTP_SECURE values other than true as false", async () => {
		vi.stubEnv("SMTP_HOST", "smtp.example.com");
		vi.stubEnv("SMTP_PORT", "587");
		vi.stubEnv("SMTP_USER", "user");
		vi.stubEnv("SMTP_PASS", "pass");
		vi.stubEnv("SMTP_SECURE", "1");

		const { send } = await import("./nodemailer");
		await send({
			to: "learner@example.com",
			subject: "SMTP",
			text: "Body",
		});

		expect(createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				secure: false,
			}),
		);
	});

	it("rejects when AbortSignal aborts while sendMail is hung", async () => {
		vi.stubEnv("SMTP_HOST", "smtp.example.com");
		vi.stubEnv("SMTP_PORT", "587");
		vi.stubEnv("SMTP_USER", "user");
		vi.stubEnv("SMTP_PASS", "pass");

		sendMail.mockImplementation(
			() =>
				new Promise(() => {
					/* hung SMTP */
				}),
		);

		const { send } = await import("./nodemailer");
		const controller = new AbortController();
		const pending = send({
			to: "learner@example.com",
			subject: "SMTP",
			text: "Body",
			signal: controller.signal,
		});

		controller.abort();
		await expect(pending).rejects.toMatchObject({ name: "AbortError" });
		expect(sendMail).toHaveBeenCalledTimes(1);
	});
});
