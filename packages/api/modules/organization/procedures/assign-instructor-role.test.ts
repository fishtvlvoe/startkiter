import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		member: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { assignInstructorRole } from "./assign-instructor-role";

const context = { context: { headers: new Headers() } };

describe("organization.assignInstructorRole", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "admin-1" },
			user: { id: "admin-1", email: "admin@example.com", role: "user" },
		} as never);
	});

	it("allows an owner or admin to assign and revoke instructor", async () => {
		vi.mocked(db.member.update)
			.mockResolvedValueOnce({ id: "member-1", role: "instructor" } as never)
			.mockResolvedValueOnce({ id: "member-1", role: "user" } as never);
		vi.mocked(db.member.findUnique)
			.mockResolvedValueOnce({ role: "admin", organizationId: "org-1", userId: "admin-1" } as never)
			.mockResolvedValueOnce({ role: "user", organizationId: "org-1", userId: "member-1" } as never)
			.mockResolvedValueOnce({ role: "admin", organizationId: "org-1", userId: "admin-1" } as never)
			.mockResolvedValueOnce({ role: "instructor", organizationId: "org-1", userId: "member-1" } as never);

		await expect(
			call(assignInstructorRole, { organizationId: "org-1", memberId: "member-1", role: "instructor" }, context),
		).resolves.toMatchObject({ role: "instructor" });
		await expect(
			call(assignInstructorRole, { organizationId: "org-1", memberId: "member-1", role: "user" }, context),
		).resolves.toMatchObject({ role: "user" });

		expect(db.member.update).toHaveBeenCalledTimes(2);
	});

	it.each(["instructor", "user"])("rejects %s from changing any member role", async (role) => {
		vi.mocked(db.member.findUnique).mockResolvedValueOnce({
			role,
			organizationId: "org-1",
			userId: `${role}-1`,
		} as never);

		await expect(
			call(assignInstructorRole, { organizationId: "org-1", memberId: "member-1", role: "instructor" }, context),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(db.member.update).not.toHaveBeenCalled();
	});
});
