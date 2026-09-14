import { describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique: vi.fn() },
	},
	getCourseAccessOrdersForUser: vi.fn(),
}));

import { db, getCourseAccessOrdersForUser } from "@startkiter/database";

import { createPrismaCourseAccessReader } from "./course-access";

describe("createPrismaCourseAccessReader().getUserRole", () => {
	it("returns the user's role when the user exists", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValueOnce({ role: "admin" } as never);

		const reader = createPrismaCourseAccessReader();
		const role = await reader.getUserRole("user_admin");

		expect(role).toBe("admin");
		expect(db.user.findUnique).toHaveBeenCalledWith({
			where: { id: "user_admin" },
			select: { role: true },
		});
	});

	it("returns the plain 'user' role when the user is not an admin", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValueOnce({ role: "user" } as never);

		const reader = createPrismaCourseAccessReader();
		const role = await reader.getUserRole("user_plain");

		expect(role).toBe("user");
	});

	it("returns null when the user does not exist, without throwing", async () => {
		vi.mocked(db.user.findUnique).mockResolvedValueOnce(null as never);

		const reader = createPrismaCourseAccessReader();

		await expect(reader.getUserRole("user_missing")).resolves.toBeNull();
	});

	it("findOrdersForUser is wired to the shared order query", () => {
		const reader = createPrismaCourseAccessReader();

		expect(reader.findOrdersForUser).toBe(getCourseAccessOrdersForUser);
	});
});
