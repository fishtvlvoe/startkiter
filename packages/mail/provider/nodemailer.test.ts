import { afterEach, describe, expect, it, vi } from "vitest";

const params = {
	from: "sender@example.com",
	to: "learner@example.com",
	subject: "Welcome",
	text: "Welcome.",
};

describe("SMTP provider", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
		vi.doUnmock("nodemailer");
	});

	it("configures nodemailer from SMTP environment variables", async () => {
		vi.stubEnv("SMTP_HOST", "smtp.example.com");
		vi.stubEnv("SMTP_PORT", "2525");
		vi.stubEnv("SMTP_USER", "smtp-user");
		vi.stubEnv("SMTP_PASS", "smtp-pass");
		vi.stubEnv("SMTP_SECURE", "true");
		const createTransport = vi.fn();
		const sendMail = vi.fn().mockResolvedValue(undefined);
		createTransport.mockReturnValue({ sendMail });
		vi.doMock("nodemailer", () => ({ default: { createTransport } }));

		const { send } = await import("./nodemailer");
		await send(params);

		expect(createTransport).toHaveBeenCalledWith({
			host: "smtp.example.com",
			port: 2525,
			secure: true,
			auth: {
				user: "smtp-user",
				pass: "smtp-pass",
			},
		});
		expect(sendMail).toHaveBeenCalledWith(expect.objectContaining(params));
	});

	it("treats only the exact SMTP_SECURE value true as secure", async () => {
		vi.stubEnv("SMTP_HOST", "smtp.example.com");
		vi.stubEnv("SMTP_PORT", "587");
		vi.stubEnv("SMTP_SECURE", "TRUE");
		const createTransport = vi.fn();
		createTransport.mockReturnValue({ sendMail: vi.fn().mockResolvedValue(undefined) });
		vi.doMock("nodemailer", () => ({ default: { createTransport } }));

		const { send } = await import("./nodemailer");
		await send(params);

		expect(createTransport).toHaveBeenCalledWith({
			host: "smtp.example.com",
			port: 587,
			secure: false,
			auth: {
				user: undefined,
				pass: undefined,
			},
		});
	});
});
