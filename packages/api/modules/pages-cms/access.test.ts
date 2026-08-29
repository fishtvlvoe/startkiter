import { afterEach, describe, expect, it } from "vitest";

import { canAccessPagesCmsAdmin, resolvePagesCmsAccess } from "./access";

const OPERATOR_EMAIL = "operator@example.com";
const originalAdminEmail = process.env.ADMIN_EMAIL;

afterEach(() => {
	process.env.ADMIN_EMAIL = originalAdminEmail;
});

describe("pages-cms shared operator guard (H-1 reverse matrix)", () => {
	it("denies a role=admin user whose email is not ADMIN_EMAIL", () => {
		process.env.ADMIN_EMAIL = OPERATOR_EMAIL;
		const session = {
			user: { id: "admin_1", email: "role-admin@example.com", role: "admin" },
		};

		expect(resolvePagesCmsAccess(session, OPERATOR_EMAIL)).toBe(403);
		expect(canAccessPagesCmsAdmin(session, OPERATOR_EMAIL)).toBe(false);
	});

	it("allows ADMIN_EMAIL even when role is not admin", () => {
		process.env.ADMIN_EMAIL = OPERATOR_EMAIL;
		const session = {
			user: { id: "op_1", email: OPERATOR_EMAIL, role: "user" },
		};

		expect(resolvePagesCmsAccess(session, OPERATOR_EMAIL)).toBeNull();
		expect(canAccessPagesCmsAdmin(session, OPERATOR_EMAIL)).toBe(true);
	});

	it("returns 401 when there is no session user", () => {
		expect(resolvePagesCmsAccess(null, OPERATOR_EMAIL)).toBe(401);
		expect(resolvePagesCmsAccess({ user: {} }, OPERATOR_EMAIL)).toBe(401);
	});
});
