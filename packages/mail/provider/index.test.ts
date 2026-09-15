import { afterEach, describe, expect, it, vi } from "vitest";

const emailParams = {
	to: "admin@example.com",
	subject: "Provider route",
	text: "Body.",
};

describe("mail provider selection", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		vi.doUnmock("./console");
		vi.doUnmock("./resend");
		vi.doUnmock("./tosend");
		vi.doUnmock("./zsend");
		vi.doUnmock("./nodemailer");
		vi.doUnmock("@startkiter/logs");
	});

	async function loadSendWithMocks(mocks: {
		consoleSend?: ReturnType<typeof vi.fn>;
		resendSend?: ReturnType<typeof vi.fn>;
		tosendSend?: ReturnType<typeof vi.fn>;
		zsendSend?: ReturnType<typeof vi.fn>;
		smtpSend?: ReturnType<typeof vi.fn>;
		loggerWarn?: ReturnType<typeof vi.fn>;
	}) {
		const consoleSend = mocks.consoleSend ?? vi.fn().mockResolvedValue(undefined);
		const resendSend = mocks.resendSend ?? vi.fn().mockResolvedValue(undefined);
		const tosendSend = mocks.tosendSend ?? vi.fn().mockResolvedValue(undefined);
		const zsendSend = mocks.zsendSend ?? vi.fn().mockResolvedValue(undefined);
		const smtpSend = mocks.smtpSend ?? vi.fn().mockResolvedValue(undefined);
		const loggerWarn = mocks.loggerWarn ?? vi.fn();

		vi.doMock("./console", () => ({ send: consoleSend }));
		vi.doMock("./resend", () => ({ send: resendSend }));
		vi.doMock("./tosend", () => ({ send: tosendSend }));
		vi.doMock("./zsend", () => ({ send: zsendSend }));
		vi.doMock("./nodemailer", () => ({ send: smtpSend }));
		vi.doMock("@startkiter/logs", () => ({
			logger: { warn: loggerWarn, log: vi.fn(), error: vi.fn() },
		}));

		const { send } = await import("./index");
		return { send, consoleSend, resendSend, tosendSend, zsendSend, smtpSend, loggerWarn };
	}

	it("uses ToSend when EMAIL_PROVIDER=tosend and TOSEND_API_KEY is set", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "tosend");
		vi.stubEnv("TOSEND_API_KEY", "ts_live");
		vi.stubEnv("RESEND_API_KEY", "re_live");
		vi.stubEnv("NODE_ENV", "production");

		const { send, tosendSend, resendSend, consoleSend } = await loadSendWithMocks({});
		await send(emailParams);

		expect(tosendSend).toHaveBeenCalledTimes(1);
		expect(resendSend).not.toHaveBeenCalled();
		expect(consoleSend).not.toHaveBeenCalled();
	});

	it("falls back to Resend when EMAIL_PROVIDER=tosend but TOSEND_API_KEY is missing", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "tosend");
		vi.stubEnv("TOSEND_API_KEY", "");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("RESEND_API_KEY", "re_live");
		vi.stubEnv("SMTP_HOST", "");
		vi.stubEnv("NODE_ENV", "production");

		const { send, tosendSend, resendSend, loggerWarn } = await loadSendWithMocks({});
		await send(emailParams);

		expect(resendSend).toHaveBeenCalledTimes(1);
		expect(tosendSend).not.toHaveBeenCalled();
		expect(loggerWarn).toHaveBeenCalled();
	});

	it("selects ToSend from fallback chain when EMAIL_PROVIDER is unset", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("TOSEND_API_KEY", "ts_live");
		vi.stubEnv("RESEND_API_KEY", "re_live");
		vi.stubEnv("SMTP_HOST", "");
		vi.stubEnv("NODE_ENV", "production");

		const { send, tosendSend, resendSend, zsendSend } = await loadSendWithMocks({});
		await send(emailParams);

		expect(tosendSend).toHaveBeenCalledTimes(1);
		expect(resendSend).not.toHaveBeenCalled();
		expect(zsendSend).not.toHaveBeenCalled();
	});

	it("treats unrecognized EMAIL_PROVIDER as unspecified and uses fallback chain", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "mailgun");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("TOSEND_API_KEY", "");
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("SMTP_HOST", "smtp.example.com");
		vi.stubEnv("NODE_ENV", "production");

		const { send, smtpSend, resendSend } = await loadSendWithMocks({});
		await send(emailParams);

		expect(smtpSend).toHaveBeenCalledTimes(1);
		expect(resendSend).not.toHaveBeenCalled();
	});

	it("falls back to console outside production when no provider credentials exist", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("TOSEND_API_KEY", "");
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("SMTP_HOST", "");
		vi.stubEnv("NODE_ENV", "development");

		const { send, consoleSend, resendSend } = await loadSendWithMocks({});
		await send(emailParams);

		expect(consoleSend).toHaveBeenCalledTimes(1);
		expect(resendSend).not.toHaveBeenCalled();
	});

	it("throws in production when no provider credentials exist", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("TOSEND_API_KEY", "");
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("SMTP_HOST", "");
		vi.stubEnv("NODE_ENV", "production");

		const { send, consoleSend } = await loadSendWithMocks({});

		await expect(send(emailParams)).rejects.toThrow(
			"No email provider is configured (checked EMAIL_PROVIDER, TOSEND_API_KEY, ZSEND_API_KEY, RESEND_API_KEY, SMTP_HOST)",
		);
		expect(consoleSend).not.toHaveBeenCalled();
	});

	it("uses Resend in production when only RESEND_API_KEY is present", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("TOSEND_API_KEY", "");
		vi.stubEnv("RESEND_API_KEY", "re_live");
		vi.stubEnv("SMTP_HOST", "");
		vi.stubEnv("NODE_ENV", "production");

		const { send, resendSend, consoleSend } = await loadSendWithMocks({});
		await send(emailParams);

		expect(resendSend).toHaveBeenCalledTimes(1);
		expect(consoleSend).not.toHaveBeenCalled();
	});
});
