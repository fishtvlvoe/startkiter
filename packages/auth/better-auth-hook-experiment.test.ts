import { createAuthMiddleware, isAPIError } from "better-auth/api";
import { getTestInstance } from "better-auth/test";
import { describe, expect, it } from "vitest";

describe("Better Auth after-hook experiment", () => {
	it("runs after hooks when email sign-in returns an APIError", async () => {
		const returnedKinds: boolean[] = [];
		const { auth } = await getTestInstance(
			{
				emailAndPassword: { enabled: true },
				hooks: {
					after: createAuthMiddleware(async (ctx) => {
						if (ctx.path.startsWith("/sign-in")) {
							returnedKinds.push(isAPIError(ctx.context.returned));
						}
					}),
				},
			},
			{ disableTestUser: true },
		);

		await expect(
			auth.api.signInEmail({
			body: { email: "missing@example.com", password: "wrong-password" },
			}),
		).rejects.toBeDefined();

		expect(returnedKinds).toEqual([true]);
	});
});
