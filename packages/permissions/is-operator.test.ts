import { afterEach, describe, expect, it } from "vitest";

import { isOperator } from "./is-operator";

const OPERATOR_EMAIL = "operator@example.com";
const originalAdminEmail = process.env.ADMIN_EMAIL;

afterEach(() => {
	process.env.ADMIN_EMAIL = originalAdminEmail;
});

describe("isOperator", () => {
	it("returns true when role is admin", () => {
		expect(
			isOperator(
				{ email: "role-admin@example.com", role: "admin" },
				OPERATOR_EMAIL,
			),
		).toBe(true);
	});

	it("returns true when email matches ADMIN_EMAIL", () => {
		expect(
			isOperator({ email: OPERATOR_EMAIL, role: "user" }, OPERATOR_EMAIL),
		).toBe(true);
	});

	it("returns false when neither role nor email matches", () => {
		expect(
			isOperator(
				{ email: "learner@example.com", role: "user" },
				OPERATOR_EMAIL,
			),
		).toBe(false);
	});

	it("returns false for null user", () => {
		expect(isOperator(null, OPERATOR_EMAIL)).toBe(false);
		expect(isOperator(undefined, OPERATOR_EMAIL)).toBe(false);
	});
});
