import { describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		bundle: { findUnique: vi.fn() },
		courseSubscription: { findFirst: vi.fn() },
		courseInviteRedemption: { findUnique: vi.fn() },
		user: { findUnique: vi.fn() },
	},
	getCourseAccessOrdersForUser: vi.fn(),
}));

import { db } from "@startkiter/database";

import { createPrismaBundleCourseAccessReader } from "./course-access";

describe("createPrismaBundleCourseAccessReader().getUserRole", () => {
	it("returns the user's role when the user exists", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValueOnce({ role: "admin" } as never);

		const reader = createPrismaBundleCourseAccessReader();
		const role = await reader.getUserRole("user_admin");

		expect(role).toBe("admin");
		expect(db.user.findUnique).toHaveBeenCalledWith({
			where: { id: "user_admin" },
			select: { role: true },
		});
	});

	it("returns the plain 'user' role when the user is not an admin", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValueOnce({ role: "user" } as never);

		const reader = createPrismaBundleCourseAccessReader();
		const role = await reader.getUserRole("user_plain");

		expect(role).toBe("user");
	});

	it("returns null when the user does not exist, without throwing", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValueOnce(null as never);

		const reader = createPrismaBundleCourseAccessReader();

		await expect(reader.getUserRole("user_missing")).resolves.toBeNull();
	});
});
