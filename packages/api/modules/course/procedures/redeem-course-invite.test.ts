import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		$transaction: vi.fn(),
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { redeemCourseInvite } from "./redeem-course-invite";

const invite = {
	id: "invite-1",
	courseId: "course-1",
	tokenHash: "unused-in-test",
	email: null,
	maxUses: 1,
	usedCount: 0,
	expiresAt: null,
	active: true,
};

describe("redeemCourseInvite", () => {
	const tx = {
		courseInvite: { findUnique: vi.fn(), updateMany: vi.fn() },
		courseInviteRedemption: { findUnique: vi.fn(), create: vi.fn() },
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "learner-1", email: "learner@example.com", role: "user" },
			session: { id: "session-1", userId: "learner-1" },
		} as never);
		vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));
		tx.courseInvite.findUnique.mockResolvedValue(invite);
		tx.courseInviteRedemption.findUnique.mockResolvedValue(null);
		tx.courseInvite.updateMany.mockResolvedValue({ count: 1 });
		tx.courseInviteRedemption.create.mockResolvedValue({ id: "redemption-1" });
	});

	it("redeems a valid token and creates one redemption record", async () => {
		const result = await call(
			redeemCourseInvite,
			{ token: "valid-token" },
			{ context: { headers: new Headers() } },
		);

		expect(result).toMatchObject({ courseId: "course-1", redeemed: true });
		expect(tx.courseInviteRedemption.create).toHaveBeenCalledOnce();
	});

	it.each([
		["invalid token", null, null, "邀請連結無效。"],
		["expired token", { ...invite, expiresAt: new Date("2020-01-01") }, null, "邀請連結已過期。"],
		["maxed token", { ...invite, usedCount: 1 }, null, "邀請連結已達使用上限。"],
		["email mismatch", { ...invite, email: "other@example.com" }, null, "此邀請連結限定其他 email。"],
	] as const)("rejects %s without a redemption", async (_label, foundInvite, _unused, message) => {
		tx.courseInvite.findUnique.mockResolvedValue(foundInvite);

		await expect(
			call(redeemCourseInvite, { token: "invalid-or-restricted" }, { context: { headers: new Headers() } }),
		).rejects.toMatchObject({ code: "BAD_REQUEST", message });
		expect(tx.courseInviteRedemption.create).not.toHaveBeenCalled();
	});

	it("rejects a concurrent claim when the conditional counter update loses the race", async () => {
		tx.courseInvite.updateMany.mockResolvedValue({ count: 0 });

		await expect(
			call(redeemCourseInvite, { token: "valid-token" }, { context: { headers: new Headers() } }),
		).rejects.toMatchObject({ code: "BAD_REQUEST", message: "邀請連結已達使用上限。" });
		expect(tx.courseInviteRedemption.create).not.toHaveBeenCalled();
	});
});
