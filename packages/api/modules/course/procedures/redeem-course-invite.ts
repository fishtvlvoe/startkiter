import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { hashCourseInviteToken } from "./create-course-invite";
import { isInviteExpired, normalizeInviteEmail } from "../lib/course-invite-auth";

function isUniqueConstraintError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function invalidInvite(message: string): never {
	throw new ORPCError("BAD_REQUEST", { message });
}

export const redeemCourseInvite = protectedProcedure
	.route({ method: "POST", path: "/course/invites/redeem", tags: ["Course"], summary: "Redeem a course invite" })
	.input(z.object({ token: z.string().trim().min(1).max(256) }))
	.handler(async ({ input, context }) => {
		let attemptedCourseId: string | null = null;
		try {
			return await db.$transaction(async (tx) => {
				const invite = await tx.courseInvite.findUnique({
					where: { tokenHash: hashCourseInviteToken(input.token) },
				});
				if (!invite) invalidInvite("邀請連結無效。");
				attemptedCourseId = invite.courseId;

				const existing = await tx.courseInviteRedemption.findUnique({
					where: { userId_courseId: { userId: context.user.id, courseId: invite.courseId } },
					select: { id: true },
				});
				if (existing) {
					return { redeemed: true, alreadyRedeemed: true, courseId: invite.courseId };
				}

				if (!invite.active) invalidInvite("這個邀請已停用。");
				if (isInviteExpired(invite.expiresAt)) invalidInvite("邀請連結已過期。");
				if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
					invalidInvite("邀請連結已達使用上限。");
				}
				if (invite.email && normalizeInviteEmail(invite.email) !== normalizeInviteEmail(context.user.email)) {
					invalidInvite("此邀請連結限定其他 email。");
				}

				const claimed = await tx.courseInvite.updateMany({
					where: {
						id: invite.id,
						active: true,
						...(invite.expiresAt ? { expiresAt: { gt: new Date() } } : {}),
						...(invite.maxUses !== null ? { usedCount: { lt: invite.maxUses } } : {}),
					},
					data: { usedCount: { increment: 1 } },
				});
				if (claimed.count !== 1) invalidInvite("邀請連結已達使用上限。");

				await tx.courseInviteRedemption.create({
					data: { userId: context.user.id, courseId: invite.courseId, inviteId: invite.id },
				});

				return { redeemed: true, alreadyRedeemed: false, courseId: invite.courseId };
			});
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				if (attemptedCourseId) {
					const existing = await db.courseInviteRedemption.findUnique({
						where: { userId_courseId: { userId: context.user.id, courseId: attemptedCourseId } },
						select: { id: true },
					});
					if (existing) {
						return { redeemed: true, alreadyRedeemed: true, courseId: attemptedCourseId };
					}
				}
				throw new ORPCError("CONFLICT", { message: "你已取得這門課的存取權。" });
			}
			throw error;
		}
	});
