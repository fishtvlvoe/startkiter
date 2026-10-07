import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearEmailSettingsCache } from "../lib/email-settings";

const providerEnvNames = [
	"EMAIL_PROVIDER",
	"TOSEND_API_KEY",
	"ZSEND_API_KEY",
	"RESEND_API_KEY",
	"SMTP_HOST",
	"SMTP_PORT",
	"SMTP_USER",
	"SMTP_PASS",
	"SMTP_SECURE",
] as const;

const params = {
	to: "admin@example.com",
	subject: "Provider routing",
	text: "Provider routing test.",
};

function clearProviderEnv(): void {
	for (const name of providerEnvNames) {
		vi.stubEnv(name, "");
	}
}

type MockProvidersOptions = {
	storedSettings?: Record<string, unknown>;
};

function mockProviders(options?: MockProvidersOptions) {
	const readEmailSettings = vi.fn().mockResolvedValue(options?.storedSettings ?? {});

	const handlers = {
		consoleSend: vi.fn().mockResolvedValue(undefined),
		resendSend: vi.fn().mockResolvedValue(undefined),
		tosendSend: vi.fn().mockResolvedValue(undefined),
		zsendSend: vi.fn().mockResolvedValue(undefined),
		smtpSend: vi.fn().mockResolvedValue(undefined),
		warn: vi.fn(),
		readEmailSettings,
	};

	vi.doMock("./console", () => ({
		send: handlers.consoleSend,
		createConsoleSender: vi.fn().mockReturnValue(handlers.consoleSend),
	}));
	vi.doMock("./resend", () => ({
		send: handlers.resendSend,
		createResendSender: vi.fn().mockReturnValue(handlers.resendSend),
	}));
	vi.doMock("./tosend", () => ({
		send: handlers.tosendSend,
		createTosendSender: vi.fn().mockReturnValue(handlers.tosendSend),
		createToSendSender: vi.fn().mockReturnValue(handlers.tosendSend),
	}));
	vi.doMock("./zsend", () => ({
		send: handlers.zsendSend,
		createZsendSender: vi.fn().mockReturnValue(handlers.zsendSend),
		createZSendSender: vi.fn().mockReturnValue(handlers.zsendSend),
	}));
	vi.doMock("./nodemailer", () => ({
		send: handlers.smtpSend,
		createNodemailerSender: vi.fn().mockReturnValue(handlers.smtpSend),
		createSmtpSender: vi.fn().mockReturnValue(handlers.smtpSend),
	}));
	vi.doMock("@startkiter/logs", () => ({
		logger: {
			log: vi.fn(),
			error: vi.fn(),
			warn: handlers.warn,
		},
	}));
	vi.doMock("../lib/email-settings", async (importOriginal) => {
		const actual = await importOriginal<typeof import("../lib/email-settings")>();
		return {
			...actual,
			readEmailSettings: handlers.readEmailSettings,
		};
	});

	return handlers;
}

describe("mail provider selection", () => {
	beforeEach(() => {
		clearEmailSettingsCache();
	});

	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
		vi.doUnmock("./console");
		vi.doUnmock("./resend");
		vi.doUnmock("./tosend");
		vi.doUnmock("./zsend");
		vi.doUnmock("./nodemailer");
		vi.doUnmock("@startkiter/logs");
		vi.doUnmock("../lib/email-settings");
	});

	it("uses ToSend when EMAIL_PROVIDER=tosend and its API key is set", async () => {
		clearProviderEnv();
		vi.stubEnv("EMAIL_PROVIDER", "tosend");
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await send(params);

		expect(handlers.tosendSend).toHaveBeenCalledWith(params);
		expect(handlers.zsendSend).not.toHaveBeenCalled();
		expect(handlers.resendSend).not.toHaveBeenCalled();
		expect(handlers.smtpSend).not.toHaveBeenCalled();
	});

	it("treats an unrecognized EMAIL_PROVIDER as unspecified and uses the fallback chain", async () => {
		clearProviderEnv();
		vi.stubEnv("EMAIL_PROVIDER", "unknown");
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		vi.stubEnv("RESEND_API_KEY", "resend-key");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await send(params);

		expect(handlers.tosendSend).toHaveBeenCalledWith(params);
		expect(handlers.resendSend).not.toHaveBeenCalled();
		expect(handlers.warn).not.toHaveBeenCalled();
	});

	it("falls back from an explicitly selected provider with no key", async () => {
		clearProviderEnv();
		vi.stubEnv("EMAIL_PROVIDER", "tosend");
		vi.stubEnv("RESEND_API_KEY", "resend-key");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await send(params);

		expect(handlers.resendSend).toHaveBeenCalledWith(params);
		expect(handlers.tosendSend).not.toHaveBeenCalled();
		expect(handlers.warn).toHaveBeenCalledWith(expect.stringContaining("tosend"));
	});

	it("uses ToSend before Resend when EMAIL_PROVIDER is unset", async () => {
		clearProviderEnv();
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		vi.stubEnv("RESEND_API_KEY", "resend-key");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await send(params);

		expect(handlers.tosendSend).toHaveBeenCalledWith(params);
		expect(handlers.resendSend).not.toHaveBeenCalled();
	});

	it("uses ZSend before every later provider when EMAIL_PROVIDER is unset", async () => {
		clearProviderEnv();
		vi.stubEnv("ZSEND_API_KEY", "zsend-key");
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await send(params);

		expect(handlers.zsendSend).toHaveBeenCalledWith(params);
		expect(handlers.tosendSend).not.toHaveBeenCalled();
		expect(handlers.resendSend).not.toHaveBeenCalled();
	});

	it("uses ToSend when ZSend is selected but unavailable", async () => {
		clearProviderEnv();
		vi.stubEnv("EMAIL_PROVIDER", "zsend");
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await send(params);

		expect(handlers.tosendSend).toHaveBeenCalledWith(params);
		expect(handlers.zsendSend).not.toHaveBeenCalled();
		expect(handlers.warn).toHaveBeenCalledWith(expect.stringContaining("zsend"));
	});

	it("uses SMTP when it is the only configured provider", async () => {
		clearProviderEnv();
		vi.stubEnv("SMTP_HOST", "smtp.example.com");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await send(params);

		expect(handlers.smtpSend).toHaveBeenCalledWith(params);
	});

	it("falls back to console outside production when no provider is configured", async () => {
		clearProviderEnv();
		vi.stubEnv("NODE_ENV", "development");
		const handlers = mockProviders();

		const { send } = await import("./index");
		await expect(send(params)).resolves.toBeUndefined();

		expect(handlers.consoleSend).toHaveBeenCalledWith(params);
	});

	it("throws in production when no provider is configured", async () => {
		clearProviderEnv();
		vi.stubEnv("NODE_ENV", "production");
		const handlers = mockProviders();

		const { send } = await import("./index");

		await expect(send(params)).rejects.toThrow(
			"No email provider is configured (checked EMAIL_PROVIDER, TOSEND_API_KEY, ZSEND_API_KEY, RESEND_API_KEY, SMTP_HOST)",
		);
		expect(handlers.consoleSend).not.toHaveBeenCalled();
	});

	it("uses stored ToSend credentials over environment Resend settings", async () => {
		clearProviderEnv();
		vi.stubEnv("EMAIL_PROVIDER", "resend");
		vi.stubEnv("RESEND_API_KEY", "re_env_key");
		const handlers = mockProviders({
			storedSettings: {
				provider: "tosend",
				tosendApiKey: "tsend_db_key",
			},
		});

		const { send } = await import("./index");
		await send(params);

		expect(handlers.readEmailSettings).toHaveBeenCalled();
		expect(handlers.tosendSend).toHaveBeenCalledWith(params);
		expect(handlers.resendSend).not.toHaveBeenCalled();
	});

	it("falls back to environment ToSend when stored SMTP lacks host and logs a warning", async () => {
		clearProviderEnv();
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		const handlers = mockProviders({
			storedSettings: {
				provider: "smtp",
				smtpHost: "",
			},
		});

		const { send } = await import("./index");
		await send(params);

		expect(handlers.readEmailSettings).toHaveBeenCalled();
		expect(handlers.tosendSend).toHaveBeenCalledWith(params);
		expect(handlers.warn).toHaveBeenCalledTimes(1);
		expect(handlers.warn).toHaveBeenCalledWith(expect.stringContaining("smtp"));
	});

	it("uses environment ZSend when no stored settings exist", async () => {
		clearProviderEnv();
		vi.stubEnv("ZSEND_API_KEY", "zsend-key");
		const handlers = mockProviders({
			storedSettings: {},
		});

		const { send } = await import("./index");
		await send(params);

		expect(handlers.readEmailSettings).toHaveBeenCalled();
		expect(handlers.zsendSend).toHaveBeenCalledWith(params);
		expect(handlers.tosendSend).not.toHaveBeenCalled();
		expect(handlers.resendSend).not.toHaveBeenCalled();
	});

	it("falls back to environment Resend and logs a warning when stored settings decryption fails", async () => {
		clearProviderEnv();
		vi.stubEnv("RESEND_API_KEY", "re_env_key");
		const handlers = mockProviders();
		handlers.readEmailSettings.mockImplementation(async () => {
			handlers.warn("Failed to decrypt stored email settings");
			return {};
		});

		const { send } = await import("./index");
		await expect(send(params)).resolves.toBeUndefined();

		expect(handlers.readEmailSettings).toHaveBeenCalled();
		expect(handlers.resendSend).toHaveBeenCalledWith(params);
		expect(handlers.warn).toHaveBeenCalledTimes(1);
	});

	it("uses DB senderName and fromEmail when caller does not provide from", async () => {
		clearProviderEnv();
		const handlers = mockProviders({
			storedSettings: {
				provider: "resend",
				resendApiKey: "re_test",
				senderName: "我的課程平台",
				fromEmail: "noreply@x.com",
			},
		});

		const { send } = await import("./index");
		await send(params);

		expect(handlers.resendSend).toHaveBeenCalledWith({
			...params,
			from: '"我的課程平台" <noreply@x.com>',
		});
	});

	it("preserves caller provided from even when DB sender is configured", async () => {
		clearProviderEnv();
		const handlers = mockProviders({
			storedSettings: {
				provider: "resend",
				resendApiKey: "re_test",
				senderName: "我的課程平台",
				fromEmail: "noreply@x.com",
			},
		});

		const customParams = {
			...params,
			from: "custom@example.com",
		};

		const { send } = await import("./index");
		await send(customParams);

		expect(handlers.resendSend).toHaveBeenCalledWith(customParams);
	});

	it("falls back to process.env.MAIL_FROM when DB fromEmail is not configured", async () => {
		clearProviderEnv();
		vi.stubEnv("MAIL_FROM", "fallback-env@example.com");
		const handlers = mockProviders({
			storedSettings: {
				provider: "resend",
				resendApiKey: "re_test",
			},
		});

		const { send } = await import("./index");
		await send(params);

		expect(handlers.resendSend).toHaveBeenCalledWith({
			...params,
			from: "fallback-env@example.com",
		});
	});
});
