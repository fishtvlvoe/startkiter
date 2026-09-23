import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique: vi.fn(), update: vi.fn() },
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { setInstructorRole } from "./set-instructor-role";

const context = { context: { headers: new Headers() } };

describe("admin.users.setInstructorRole", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "admin-1" },
			user: { id: "admin-1", email: "admin@example.com", role: "admin" },
		} as never);
		vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-1", role: "user" } as never);
		vi.mocked(db.user.update).mockResolvedValue({ id: "user-1", role: "instructor" } as never);
	});

	it("allows an admin to assign and revoke the instructor role", async () => {
		await expect(call(setInstructorRole, { userId: "user-1", role: "instructor" }, context)).resolves.toEqual({ id: "user-1", role: "instructor" });
		expect(db.user.update).toHaveBeenCalledWith({
			where: { id: "user-1" },
			data: { role: "instructor" },
			select: { id: true, role: true },
		});
	});

	it("rejects an instructor from changing roles", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "instructor-1" },
			user: { id: "instructor-1", email: "instructor@example.com", role: "instructor" },
		} as never);

		await expect(call(setInstructorRole, { userId: "user-1", role: "instructor" }, context)).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(db.user.update).not.toHaveBeenCalled();
	});

	it("rejects self role changes", async () => {
		await expect(call(setInstructorRole, { userId: "admin-1", role: "instructor" }, context)).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.user.update).not.toHaveBeenCalled();
	});
});
