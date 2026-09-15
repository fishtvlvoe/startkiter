import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("unsubscribe token HMAC", () => {
	beforeEach(() => {
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-for-tests");
		vi.stubEnv("BETTER_AUTH_SECRET", "auth-secret-must-not-be-used");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it("binds scope into the signature so swapping scope fails verification", async () => {
		const { createUnsubscribeToken, verifyUnsubscribeToken } = await import(
			"./unsubscribe-token"
		);

		const token = createUnsubscribeToken({
			userId: "user_1",
			email: "learner@example.com",
			scope: "marketing",
		});
		const tampered = token.replace(".marketing.", ".all.");

		expect(verifyUnsubscribeToken({ token: tampered, email: "learner@example.com" })).toEqual({
			ok: false,
		});
		expect(verifyUnsubscribeToken({ token, email: "learner@example.com" })).toMatchObject({
			ok: true,
			userId: "user_1",
			scope: "marketing",
		});
	});

	it("reads NEWSLETTER_UNSUBSCRIBE_SECRET and does not use BETTER_AUTH_SECRET", async () => {
		const { createUnsubscribeToken } = await import("./unsubscribe-token");
		const withNewsletter = createUnsubscribeToken({
			userId: "user_1",
			email: "learner@example.com",
			scope: "general",
		});

		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "");
		vi.resetModules();
		const { createUnsubscribeToken: createWithoutSecret } = await import("./unsubscribe-token");
		expect(() =>
			createWithoutSecret({
				userId: "user_1",
				email: "learner@example.com",
				scope: "general",
			}),
		).toThrow(/NEWSLETTER_UNSUBSCRIBE_SECRET/);

		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-for-tests");
		vi.stubEnv("BETTER_AUTH_SECRET", "completely-different-auth-secret");
		vi.resetModules();
		const { createUnsubscribeToken: createAgain } = await import("./unsubscribe-token");
		const withDifferentAuth = createAgain({
			userId: "user_1",
			email: "learner@example.com",
			scope: "general",
		});
		expect(withDifferentAuth).toBe(withNewsletter);
	});
});
