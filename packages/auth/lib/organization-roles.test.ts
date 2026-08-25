import { describe, expect, it } from "vitest";

import {
	assertOrganizationMemberRole,
	normalizeOrganizationMemberRole,
} from "./organization-roles";

describe("organization member roles", () => {
	it.each(["owner", "admin", "instructor", "user"])(
		"accepts the fixed role %s",
		(role) => {
			expect(assertOrganizationMemberRole(role)).toBe(role);
		},
	);

	it("rejects a role outside the fixed four-value set", () => {
		expect(() => assertOrganizationMemberRole("moderator")).toThrow(
		"Invalid organization member role: moderator",
	);
	});

	it("normalizes Better Auth's native member role to user", () => {
		expect(normalizeOrganizationMemberRole("member")).toBe("user");
	});
});
