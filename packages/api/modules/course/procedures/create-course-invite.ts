import { createHash, randomBytes } from "node:crypto";

import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { courseInviteOperatorProcedure, normalizeInviteEmail } from "../lib/course-invite-auth";

export function hashCourseInviteToken(token: string): string {
	return createHash("sha256").update(token, "utf8").digest("hex");
}

function resolveInviteBaseUrl(requestUrl?: string): string {
	if (requestUrl) {
		try {
			return new URL(requestUrl).origin;
		} catch {
			// Fall through to the configured URL for malformed or relative test URLs.
		}
	}

	return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

const createCourseInviteInput = z.object({
	courseId: z.string().min(1),
	email: z.string().email().nullable().optional(),
	maxUses: z.number().int().positive().nullable().optional(),
	expiresAt: z.coerce.date().nullable().optional(),
});

export const createCourseInvite = courseInviteOperatorProcedure
	.route({ method: "POST", path: "/course/invites", tags: ["Course"], summary: "Create a course invite" })
	.input(createCourseInviteInput)
	.handler(async ({ input, context }) => {
		const course = await db.course.findUnique({ where: { id: input.courseId }, select: { id: true } });
		if (!course) throw new ORPCError("NOT_FOUND", { message: "找不到指定課程。" });

		const expiresAt = input.expiresAt ?? null;
		if (expiresAt && expiresAt.getTime() <= Date.now()) {
			throw new ORPCError("BAD_REQUEST", { message: "到期時間必須晚於現在。" });
		}

		const token = randomBytes(32).toString("base64url");
		const invite = await db.courseInvite.create({
			data: {
				courseId: input.courseId,
				tokenHash: hashCourseInviteToken(token),
				email: input.email ? normalizeInviteEmail(input.email) : null,
				maxUses: input.maxUses ?? null,
				expiresAt,
				createdBy: context.user.id,
			},
		});

		return {
			invite: {
				id: invite.id,
				courseId: invite.courseId,
				email: invite.email,
				maxUses: invite.maxUses,
				usedCount: invite.usedCount,
				expiresAt: invite.expiresAt,
				active: invite.active,
				createdAt: invite.createdAt,
			},
			token,
			inviteUrl: `${resolveInviteBaseUrl(context.url)}/invite/${token}`,
		};
	});

export const listCourseInvites = courseInviteOperatorProcedure
	.route({ method: "GET", path: "/course/invites", tags: ["Course"], summary: "List course invites" })
	.handler(async () => {
		const invites = await db.courseInvite.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				courseId: true,
				email: true,
				maxUses: true,
				usedCount: true,
				expiresAt: true,
				active: true,
				createdAt: true,
				course: { select: { id: true, title: true } },
			},
		});
		return { invites };
	});

export const deactivateCourseInvite = courseInviteOperatorProcedure
	.route({ method: "POST", path: "/course/invites/deactivate", tags: ["Course"], summary: "Deactivate a course invite" })
	.input(z.object({ inviteId: z.string().min(1) }))
	.handler(async ({ input }) => {
		const invite = await db.courseInvite.findUnique({ where: { id: input.inviteId }, select: { id: true } });
		if (!invite) throw new ORPCError("NOT_FOUND", { message: "找不到指定邀請。" });
		return db.courseInvite.update({ where: { id: input.inviteId }, data: { active: false } });
	});
