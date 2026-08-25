import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		$transaction: vi.fn(async (callback: (transaction: unknown) => unknown) =>
			callback({
				member: {
					updateMany: vi.fn(),
					update: vi.fn(),
				},
			}),
		),
		member: {
			count: vi.fn(),
		},
	},
}));

import { db } from "@startkiter/database";

import { organizationRoleHooks } from "./organization-role-hooks";

describe("organization role hooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("transfers ownership and leaves exactly one owner", async () => {
		await organizationRoleHooks.beforeUpdateMemberRole({
			member: { id: "new-owner", organizationId: "org-1", role: "admin" },
			newRole: "owner",
		});

		expect(db.$transaction).toHaveBeenCalledTimes(1);
	});

	it("rejects removing the only owner", async () => {
		vi.mocked(db.member.count).mockResolvedValueOnce(1);

		await expect(
			organizationRoleHooks.beforeUpdateMemberRole({
				member: { id: "owner-1", organizationId: "org-1", role: "owner" },
				newRole: "admin",
			}),
		).rejects.toMatchObject({ status: "BAD_REQUEST" });
	});
});
