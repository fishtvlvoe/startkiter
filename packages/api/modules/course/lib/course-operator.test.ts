import { call } from "@orpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";

import { courseOperatorProcedure } from "./course-operator";

const OPERATOR_EMAIL = "operator@example.com";
const originalAdminEmail = process.env.ADMIN_EMAIL;

describe("courseOperatorProcedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = OPERATOR_EMAIL;
	});

	afterEach(() => {
		process.env.ADMIN_EMAIL = originalAdminEmail;
	});

	it("allows a role=admin user whose email is not ADMIN_EMAIL", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-admin", userId: "admin-1" },
			user: {
				id: "admin-1",
				email: "role-admin@example.com",
				role: "admin",
			},
		} as never);

		const testProcedure = courseOperatorProcedure.handler(async () => ({
			ok: true,
		}));

		await expect(
			call(testProcedure, undefined, {
				context: { headers: new Headers() },
			}),
		).resolves.toEqual({ ok: true });
	});
});
