import { afterEach, describe, expect, it, vi } from "vitest";

describe("mail provider selection", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
		vi.doUnmock("./console");
		vi.doUnmock("./resend");
	});

	it("falls back to the console provider outside production when the API key is missing", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("NODE_ENV", "development");
		const consoleSend = vi.fn().mockResolvedValue(undefined);
		const resendSend = vi.fn().mockResolvedValue(undefined);
		vi.doMock("./console", () => ({ send: consoleSend }));
		vi.doMock("./resend", () => ({ send: resendSend }));

		const { send } = await import("./index");
		await send({
			to: "admin@example.com",
			subject: "Dev fallback",
			text: "Logged locally.",
		});

		expect(consoleSend).toHaveBeenCalledTimes(1);
		expect(resendSend).not.toHaveBeenCalled();
	});

	it("uses Resend in production when the API key is present", async () => {
		vi.stubEnv("RESEND_API_KEY", "re_live");
		vi.stubEnv("NODE_ENV", "production");
		const consoleSend = vi.fn().mockResolvedValue(undefined);
		const resendSend = vi.fn().mockResolvedValue(undefined);
		vi.doMock("./console", () => ({ send: consoleSend }));
		vi.doMock("./resend", () => ({ send: resendSend }));

		const { send } = await import("./index");
		await send({
			to: "admin@example.com",
			subject: "Prod send",
			text: "Delivered.",
		});

		expect(resendSend).toHaveBeenCalledTimes(1);
		expect(consoleSend).not.toHaveBeenCalled();
	});

	it("keeps production fail-closed when the API key is missing", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("NODE_ENV", "production");
		const { send } = await import("./index");

		await expect(
			send({
				to: "admin@example.com",
				subject: "Must not discard",
				text: "Fail closed.",
			}),
		).rejects.toThrow("RESEND_API_KEY is required");
	});
});
