import { describe, expect, it } from "vitest";

import { resolveSupportEmail } from "./support-email";

describe("resolveSupportEmail", () => {
	it("prefers SUPPORT_EMAIL over EMAIL_FROM", () => {
		expect(
			resolveSupportEmail({
				SUPPORT_EMAIL: " support@example.com ",
				EMAIL_FROM: "from@example.com",
			}),
		).toBe("support@example.com");
	});

	it("falls back to EMAIL_FROM", () => {
		expect(resolveSupportEmail({ EMAIL_FROM: "from@example.com" })).toBe("from@example.com");
	});

	it("returns null when neither is set", () => {
		expect(resolveSupportEmail({})).toBeNull();
	});
});
