import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { userCanAccessCourseId } from "../lib/course-access";
import { courseOperatorProcedure, isCourseOperator } from "../lib/course-operator";
import {
	buildLessonMessageStorageKey,
	getLessonMessageSignedDownloadUrl,
	getLessonMessageSignedUploadUrl,
	MAX_LESSON_MESSAGE_ATTACHMENT_SIZE,
} from "./lesson-message-upload";

const attachmentSchema = z.object({
	filename: z.string().trim().min(1).max(255),
	mimeType: z.string().trim().min(1).max(120),
	size: z.number().int().min(1).max(MAX_LESSON_MESSAGE_ATTACHMENT_SIZE),
});

const messageInput = z.object({
	lessonId: z.string().trim().min(1).max(200),
	content: z.string().trim().min(1).max(10_000),
	isFromTeacher: z.boolean().default(false),
	threadUserId: z.string().trim().min(1).max(200).optional(),
	attachment: attachmentSchema.optional(),
});

async function requireLessonAccess(lessonId: string, userId: string): Promise<{ courseId: string }> {
	const lesson = await db.lesson.findUnique({
		where: { id: lessonId },
		select: { status: true, isFreePreview: true, chapter: { select: { courseId: true } } },
	});
	if (!lesson || lesson.status !== "PUBLISHED") throw new ORPCError("NOT_FOUND", { message: "找不到指定單元。" });
	if (!lesson.isFreePreview && !(await userCanAccessCourseId(userId, lesson.chapter.courseId))) throw new ORPCError("FORBIDDEN");
	return { courseId: lesson.chapter.courseId };
}

async function withAttachmentUrl<T extends { attachmentStorageKey: string | null; attachmentName: string | null; attachmentMimeType: string | null }>(message: T): Promise<T & { attachmentUrl: string | null }> {
	const attachmentUrl = message.attachmentStorageKey && message.attachmentName
		? await getLessonMessageSignedDownloadUrl({ storageKey: message.attachmentStorageKey, filename: message.attachmentName, mimeType: message.attachmentMimeType })
		: null;
	return { ...message, attachmentUrl };
}

export const sendLessonMessage = protectedProcedure
	.route({ method: "POST", path: "/course/lesson-messages", tags: ["Course messages"], summary: "Send a private lesson message" })
	.input(messageInput)
	.handler(async ({ input, context }) => {
		const operator = isCourseOperator(context.user.email, process.env.ADMIN_EMAIL);
		if (input.isFromTeacher && !operator) throw new ORPCError("FORBIDDEN");
		if (!input.isFromTeacher && input.threadUserId) throw new ORPCError("BAD_REQUEST", { message: "學員不能指定其他私訊串。" });

		let userId = context.user.id;
		if (input.isFromTeacher) {
			if (!input.threadUserId) throw new ORPCError("BAD_REQUEST", { message: "老師回覆需要指定私訊串。" });
			const thread = await db.lessonPrivateMessage.findFirst({
				where: { lessonId: input.lessonId, userId: input.threadUserId, isFromTeacher: false },
				select: { userId: true },
			});
			if (!thread) throw new ORPCError("NOT_FOUND", { message: "找不到指定私訊串。" });
			userId = thread.userId;
		} else {
			await requireLessonAccess(input.lessonId, context.user.id);
		}

		const attachmentStorageKey = input.attachment ? buildLessonMessageStorageKey(input.lessonId, input.attachment.filename) : null;
		const signedUploadUrl = input.attachment && attachmentStorageKey
			? (await getLessonMessageSignedUploadUrl({
				storageKey: attachmentStorageKey,
				contentType: input.attachment.mimeType,
				size: input.attachment.size,
				maxSize: MAX_LESSON_MESSAGE_ATTACHMENT_SIZE,
			})).signedUploadUrl
			: null;
		const message = await db.lessonPrivateMessage.create({
			data: {
				lessonId: input.lessonId,
				userId,
				content: input.content,
				attachmentStorageKey,
				attachmentName: input.attachment?.filename ?? null,
				attachmentMimeType: input.attachment?.mimeType ?? null,
				attachmentSize: input.attachment?.size ?? null,
				isFromTeacher: input.isFromTeacher,
				readByTeacher: input.isFromTeacher,
			},
		});
		return { ...(await withAttachmentUrl(message)), signedUploadUrl };
	});

export const listLessonMessages = protectedProcedure
	.route({ method: "GET", path: "/course/lesson-messages/{lessonId}", tags: ["Course messages"], summary: "List private lesson messages" })
	.input(z.object({ lessonId: z.string().trim().min(1).max(200) }))
	.handler(async ({ input, context }) => {
		await requireLessonAccess(input.lessonId, context.user.id);
		const messages = await db.lessonPrivateMessage.findMany({
			where: { lessonId: input.lessonId, userId: context.user.id },
			orderBy: { createdAt: "asc" },
		});
		return { messages: await Promise.all(messages.map((message) => withAttachmentUrl(message))) };
	});

export const operatorListLessonMessages = courseOperatorProcedure
	.route({ method: "GET", path: "/course/lesson-messages/operator", tags: ["Course messages"], summary: "List private lesson messages for operators" })
	.input(z.object({ unreadOnly: z.boolean().default(false) }))
	.handler(async ({ input }) => {
		const messages = await db.lessonPrivateMessage.findMany({
			where: input.unreadOnly ? { isFromTeacher: false, readByTeacher: false } : undefined,
			orderBy: { createdAt: "desc" },
			include: { lesson: { select: { title: true } }, user: { select: { id: true, name: true, email: true } } },
		});
		return { messages: await Promise.all(messages.map((message) => withAttachmentUrl(message))) };
	});

export const markLessonMessageRead = courseOperatorProcedure
	.route({ method: "POST", path: "/course/lesson-messages/{messageId}/read", tags: ["Course messages"], summary: "Mark a private lesson message as read" })
	.input(z.object({ messageId: z.string().trim().min(1).max(200) }))
	.handler(async ({ input }) => {
		const updated = await db.lessonPrivateMessage.updateMany({
			where: { id: input.messageId, isFromTeacher: false, readByTeacher: false },
			data: { readByTeacher: true },
		});
		return { read: updated.count === 1 || updated.count === 0 };
	});
