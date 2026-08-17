import { describe, expect, it } from "vitest";

import { isOperator, operatorHttpStatus, shouldShowOperatorSettingsLink } from "./operator";

describe("isOperator", () => {
	it("matches ADMIN_EMAIL after trim and ASCII case folding", () => {
		expect(isOperator("Ops@Startkiter.test", "ops@startkiter.test")).toBe(true);
		expect(isOperator(" Fish@Aiver.me ", "Fish@Aiver.me")).toBe(true);
	});

	it("returns false when ADMIN_EMAIL is empty", () => {
		expect(isOperator("ops@startkiter.test", "")).toBe(false);
		expect(isOperator("ops@startkiter.test", undefined)).toBe(false);
		expect(isOperator("ops@startkiter.test", "   ")).toBe(false);
	});

	it("returns false when emails differ", () => {
		expect(isOperator("learner@example.com", "ops@startkiter.test")).toBe(false);
		expect(isOperator(null, "ops@startkiter.test")).toBe(false);
	});
});

describe("operatorHttpStatus", () => {
	it("returns 401 without a session", () => {
		expect(operatorHttpStatus(null, "ops@startkiter.test")).toBe(401);
	});

	it("returns 403 when ADMIN_EMAIL is empty even if signed in", () => {
		expect(
			operatorHttpStatus({ user: { id: "u1", email: "ops@startkiter.test" } }, ""),
		).toBe(403);
	});

	it("returns null for a matching operator", () => {
		expect(
			operatorHttpStatus(
				{ user: { id: "u1", email: "Ops@Startkiter.test" } },
				"ops@startkiter.test",
			),
		).toBeNull();
	});
});

describe("shouldShowOperatorSettingsLink", () => {
	it("is true only for signed-in operators", () => {
		expect(
			shouldShowOperatorSettingsLink(true, "ops@startkiter.test", "ops@startkiter.test"),
		).toBe(true);
		expect(
			shouldShowOperatorSettingsLink(true, "learner@example.com", "ops@startkiter.test"),
		).toBe(false);
		expect(
			shouldShowOperatorSettingsLink(false, "ops@startkiter.test", "ops@startkiter.test"),
		).toBe(false);
	});
});
