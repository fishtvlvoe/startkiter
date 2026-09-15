import { afterEach, describe, expect, it, vi } from "vitest";

describe("mail provider without a Resend key", () => {
	afterEach(async () => {
		vi.resetModules();
		vi.unstubAllEnvs();
		// resend.ts 用 lazy client；清掉快取避免 env stub 被上一輪綁死
		const { resetResendClientForTests } = await import("./provider/resend");
		resetResendClientForTests();
	});

	it("loads a send handler instead of throwing during module evaluation", async () => {
		vi.stubEnv("RESEND_API_KEY", "");

		await expect(import("./provider")).resolves.toMatchObject({
			send: expect.any(Function),
		});
	});

	it("uses the console handler outside production when the key is missing", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("TOSEND_API_KEY", "");
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("SMTP_HOST", "");
		vi.stubEnv("NODE_ENV", "test");
		const { send } = await import("./provider");

		await expect(
			send({
				to: "admin@example.com",
				subject: "Provider fallback",
				text: "This email is logged locally.",
			}),
		).resolves.toBeUndefined();
	});

	it("keeps production email sending fail-closed when the key is missing", async () => {
		vi.stubEnv("EMAIL_PROVIDER", "");
		vi.stubEnv("ZSEND_API_KEY", "");
		vi.stubEnv("TOSEND_API_KEY", "");
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("SMTP_HOST", "");
		vi.stubEnv("NODE_ENV", "production");
		const { send } = await import("./provider");

		await expect(
			send({
				to: "admin@example.com",
				subject: "Provider fallback",
				text: "This email must not be silently discarded.",
			}),
		).rejects.toThrow(
			"No email provider is configured (checked EMAIL_PROVIDER, TOSEND_API_KEY, ZSEND_API_KEY, RESEND_API_KEY, SMTP_HOST)",
		);
	});
});
