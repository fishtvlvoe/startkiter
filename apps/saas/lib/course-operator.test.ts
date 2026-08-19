import { afterEach, describe, expect, it } from "vitest";

import { isCourseOperator } from "./course-operator";

const originalAdminEmail = process.env.ADMIN_EMAIL;

afterEach(() => {
	if (originalAdminEmail === undefined) {
		delete process.env.ADMIN_EMAIL;
		return;
	}
	process.env.ADMIN_EMAIL = originalAdminEmail;
});

describe("isCourseOperator", () => {
	it("allows explicit global operator roles", () => {
		expect(isCourseOperator({ email: "learner@example.test", role: "admin" })).toBe(true);
		expect(isCourseOperator({ email: "learner@example.test", role: "operator" })).toBe(true);
	});

	it("allows only exact normalized addresses from ADMIN_EMAIL", () => {
		process.env.ADMIN_EMAIL = "Operator@example.test, second@example.test";

		expect(isCourseOperator({ email: "operator@example.test", role: "user" })).toBe(true);
		expect(isCourseOperator({ email: "SECOND@example.test", role: null })).toBe(true);
	});

	it("rejects ordinary authenticated users", () => {
		process.env.ADMIN_EMAIL = "operator@example.test";

		expect(isCourseOperator({ email: "learner@example.test", role: "user" })).toBe(false);
	});
});
