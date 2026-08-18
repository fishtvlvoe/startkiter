import { afterEach, describe, expect, it, vi } from "vitest";

describe("mail provider without a Resend key", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
	});

	it("loads a send handler instead of throwing during module evaluation", async () => {
		vi.stubEnv("RESEND_API_KEY", "");

		await expect(import("./provider")).resolves.toMatchObject({
			send: expect.any(Function),
		});
	});

	it("uses the console handler outside production when the key is missing", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
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
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("NODE_ENV", "production");
		const { send } = await import("./provider");

		await expect(
			send({
				to: "admin@example.com",
				subject: "Provider fallback",
				text: "This email must not be silently discarded.",
			}),
		).rejects.toThrow("RESEND_API_KEY is required");
	});
});
