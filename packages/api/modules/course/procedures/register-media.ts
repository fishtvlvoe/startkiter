import { randomUUID } from "node:crypto";

import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";
import { resolveVideoSource } from "../lib/video-resolver";

const usageSchema = z.object({
	usageType: z.enum(["MANUAL", "LESSON_CONTENT", "COURSE_COVER"]).optional(),
	usageId: z.string().trim().min(1).max(200).optional(),
}).superRefine((value, context) => {
	if (value.usageId && !value.usageType) {
		context.addIssue({ code: "custom", path: ["usageType"], message: "usageType is required with usageId" });
	}
});

const videoInput = z.object({
	type: z.literal("VIDEO"),
	url: z.string().trim().url().max(2000),
	}).merge(usageSchema);

const imageInput = z.object({
	type: z.literal("IMAGE"),
	path: z.string().trim().min(1).max(500),
	filename: z.string().trim().min(1).max(255),
	mimeType: z.string().trim().regex(/^image\/[a-z0-9.+-]+$/i).max(120),
	size: z.number().int().min(1).max(10_000_000),
	}).merge(usageSchema);

const inputSchema = z.discriminatedUnion("type", [videoInput, imageInput]);

function assertImagePath(path: string, userId: string): void {
	if (!path.startsWith(`media/${userId}/`) || path.includes("..") || path.includes("\\")) {
		throw new ORPCError("BAD_REQUEST", { message: "圖片路徑無效。" });
	}
}

export const registerMedia = courseOperatorProcedure
	.route({ method: "POST", path: "/course/media", tags: ["Course media"], summary: "Register course media" })
	.input(inputSchema)
	.handler(async ({ input, context }) => {
		if (input.type === "VIDEO") {
			const resolved = resolveVideoSource(input.url);
			if (!resolved.ok) throw new ORPCError("BAD_REQUEST", { message: resolved.error });
			return db.media.create({
				data: {
					type: "VIDEO",
					provider: resolved.provider,
					sourceId: resolved.sourceId ?? null,
					url: resolved.url,
					uploadedBy: context.user.id,
					usageType: input.usageType ?? "MANUAL",
					usageId: input.usageId ?? null,
				},
			});
		}

		assertImagePath(input.path, context.user.id);
		const media = await db.media.create({
			data: {
				type: "IMAGE",
				provider: null,
				sourceId: null,
				url: input.path,
				filename: input.filename,
				mimeType: input.mimeType,
				size: input.size,
				uploadedBy: context.user.id,
				usageType: input.usageType ?? "MANUAL",
				usageId: input.usageId ?? null,
			},
		});

		if (input.usageType === "COURSE_COVER" && input.usageId) {
			await db.course.update({ where: { id: input.usageId }, data: { coverImageUrl: input.path } });
		}

		return media;
	});

export const mediaPathForUpload = (userId: string, filename: string): string => {
	const extension = filename.toLowerCase().match(/\.([a-z0-9]{1,12})$/)?.[1] ?? "bin";
	return `media/${userId}/${randomUUID()}.${extension}`;
};
