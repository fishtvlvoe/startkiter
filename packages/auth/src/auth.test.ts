import { describe, expect, it } from "vitest";

import { getSocialProviders, mapLineProfileToUser } from "./providers";
import { createTestAuth } from "./test-auth";

describe("email/password auth", () => {
	it("rejects an empty email without creating a user", async () => {
		const auth = createTestAuth();

		const response = await auth.handler(
			new Request("http://localhost/api/auth/sign-up/email", {
				method: "POST",
				body: JSON.stringify({ email: "", password: "StartKiter1!", name: "Alice" }),
				headers: { "content-type": "application/json" },
			}),
		);

		expect(response.status).toBe(400);
		expect(auth.users()).toHaveLength(0);
	});

	it("rejects an empty password without creating a user", async () => {
		const auth = createTestAuth();

		const response = await auth.handler(
			new Request("http://localhost/api/auth/sign-up/email", {
				method: "POST",
				body: JSON.stringify({ email: "alice@example.com", password: "", name: "Alice" }),
				headers: { "content-type": "application/json" },
			}),
		);

		expect(response.status).toBe(400);
		expect(auth.users()).toHaveLength(0);
	});

	it("creates a user and establishes a session for valid credentials", async () => {
		const auth = createTestAuth();

		const signUpResponse = await auth.handler(
			new Request("http://localhost/api/auth/sign-up/email", {
				method: "POST",
				body: JSON.stringify({ email: "alice@example.com", password: "StartKiter1!", name: "Alice" }),
				headers: { "content-type": "application/json" },
			}),
		);

		expect(signUpResponse.status).toBe(200);
		expect(auth.users()).toHaveLength(1);

		const signInResponse = await auth.handler(
			new Request("http://localhost/api/auth/sign-in/email", {
				method: "POST",
				body: JSON.stringify({ email: "alice@example.com", password: "StartKiter1!" }),
				headers: { "content-type": "application/json" },
			}),
		);

		expect(signInResponse.status).toBe(200);
		expect(signInResponse.headers.get("set-cookie")).toContain("better-auth.session_token");
	});
});

describe("auth secrets fail closed", () => {
	it("does not create a session when BETTER_AUTH_SECRET is missing", async () => {
		const auth = createTestAuth({
			BETTER_AUTH_SECRET: "",
			GOOGLE_CLIENT_ID: "google-id",
			GOOGLE_CLIENT_SECRET: "google-secret",
		});

		const response = await auth.handler(
			new Request("http://localhost/api/auth/sign-in/email", {
				method: "POST",
				body: JSON.stringify({ email: "alice@example.com", password: "StartKiter1!" }),
				headers: { "content-type": "application/json" },
			}),
		);

		expect(response.status).toBeGreaterThanOrEqual(400);
		expect(response.headers.get("set-cookie")).toBeNull();
		expect(auth.enabledProviders.google).toBe(false);
	});

	it("does not claim a user was created when DATABASE_URL is missing", async () => {
		const auth = createTestAuth({ DATABASE_URL: "" });

		const response = await auth.handler(
			new Request("http://localhost/api/auth/sign-up/email", {
				method: "POST",
				body: JSON.stringify({ email: "alice@example.com", password: "StartKiter1!", name: "Alice" }),
				headers: { "content-type": "application/json" },
			}),
		);

		expect(response.status).toBeGreaterThanOrEqual(400);
		expect(auth.users()).toHaveLength(0);
	});
});

describe("social provider configuration", () => {
	it("does not enable Google or LINE without complete credentials", () => {
		expect(getSocialProviders({})).toEqual({});
		expect(
			getSocialProviders({
				GOOGLE_CLIENT_ID: "google-id",
				GOOGLE_CLIENT_SECRET: "",
				LINE_CHANNEL_ID: "line-id",
				LINE_CHANNEL_SECRET: "line-secret",
			}),
		).toHaveProperty("line");
	});

	it("maps a LINE profile without email to a stable internal identity", () => {
		expect(
			mapLineProfileToUser({
				sub: "U1234567890abcdef",
				name: "LINE 使用者",
			}),
		).toMatchObject({
				email: "line-u1234567890abcdef@accounts.startkiter.invalid",
			});
	});
});
