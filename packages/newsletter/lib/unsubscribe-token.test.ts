import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createUnsubscribeToken,
	verifyUnsubscribeToken,
} from "./unsubscribe-token";

describe("HMAC unsubscribe token", () => {
	beforeEach(() => {
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-2026");
		vi.stubEnv("BETTER_AUTH_SECRET", "different-auth-secret");
	});

	it("signs the user, email, and scope with NEWSLETTER_UNSUBSCRIBE_SECRET", () => {
		const token = createUnsubscribeToken({
			userId: "user-1",
			email: "Learner@Example.com",
			scope: "marketing",
		});
		const expectedSignature = createHmac("sha256", "newsletter-secret-2026")
			.update("user-1:Learner@Example.com:marketing")
			.digest("base64url");

		expect(token).toBe(expectedSignature);
		expect(token).not.toBe(
			createHmac("sha256", "different-auth-secret")
				.update("user-1:Learner@Example.com:marketing")
				.digest("base64url"),
		);
	});

	it("rejects a token when only the scope changes", () => {
		const token = createUnsubscribeToken({
			userId: "user-1",
			email: "learner@example.com",
			scope: "marketing",
		});

		expect(
			verifyUnsubscribeToken({
				userId: "user-1",
				email: "learner@example.com",
				scope: "marketing",
				token,
			}),
		).toBe(true);
		expect(
			verifyUnsubscribeToken({
				userId: "user-1",
				email: "learner@example.com",
				scope: "all",
				token,
			}),
		).toBe(false);
	});

	it("fails closed when the dedicated secret is absent", () => {
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "");

		expect(() =>
			createUnsubscribeToken({
				userId: "user-1",
				email: "learner@example.com",
				scope: "all",
			}),
		).toThrow(/NEWSLETTER_UNSUBSCRIBE_SECRET/);
	});
});
