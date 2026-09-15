import { afterEach, describe, expect, it, vi } from "vitest";

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

function mockProviders() {
	const handlers = {
		consoleSend: vi.fn().mockResolvedValue(undefined),
		resendSend: vi.fn().mockResolvedValue(undefined),
		tosendSend: vi.fn().mockResolvedValue(undefined),
		zsendSend: vi.fn().mockResolvedValue(undefined),
		smtpSend: vi.fn().mockResolvedValue(undefined),
		warn: vi.fn(),
	};

	vi.doMock("./console", () => ({ send: handlers.consoleSend }));
	vi.doMock("./resend", () => ({ send: handlers.resendSend }));
	vi.doMock("./tosend", () => ({ send: handlers.tosendSend }));
	vi.doMock("./zsend", () => ({ send: handlers.zsendSend }));
	vi.doMock("./nodemailer", () => ({ send: handlers.smtpSend }));
	vi.doMock("@startkiter/logs", () => ({
		logger: {
			log: vi.fn(),
			error: vi.fn(),
			warn: handlers.warn,
		},
	}));

	return handlers;
}

describe("mail provider selection", () => {
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

		await expect(send(params)).rejects.toThrow("No email provider is configured");
		expect(handlers.consoleSend).not.toHaveBeenCalled();
	});
});
