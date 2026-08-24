import { ORPCError } from "@orpc/server";
import {
	assignmentDefinitionBodySchema,
	calculateSubmissionRules,
	countAssignmentWords,
	createAssignmentDefinition,
	getAssignmentDefinition,
	incrementRevisionNumber,
	sanitizeAssignmentContent,
} from "@startkiter/course-assignment";
import { db } from "@startkiter/database";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { protectedProcedure } from "../../orpc/procedures";
import { userCanAccessCourseId } from "../course/lib/course-access";
import { courseOperatorProcedure } from "../course/lib/course-operator";
import {
	buildAssignmentAttachmentStorageKey,
	getAssignmentSignedUploadUrl,
} from "./assignment-upload";

const contentSchema = z.string().max(200_000).nullable().optional();
const attachmentSchema = z.object({
	filename: z.string().trim().min(1).max(255),
	mimeType: z.string().trim().min(1).max(120),
	size: z.number().int().min(1).max(100_000_000),
	storageKey: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/),
});

const assignmentOperatorProcedure = courseOperatorProcedure;

async function getAccessibleAssignment(pluginContentId: string, userId: string) {
	const definition = await getAssignmentDefinition(pluginContentId);
	if (!definition) throw new ORPCError("NOT_FOUND");

	const lesson = await db.lesson.findUnique({
		where: { id: definition.body.lessonId },
		select: { status: true, isFreePreview: true, chapter: { select: { courseId: true } } },
	});
	if (!lesson || lesson.status !== "PUBLISHED") throw new ORPCError("NOT_FOUND");
	if (!lesson.isFreePreview && !(await userCanAccessCourseId(userId, lesson.chapter.courseId))) {
		throw new ORPCError("FORBIDDEN");
	}

	return definition;
}

function getDefinitionDueAt(definition: Awaited<ReturnType<typeof getAssignmentDefinition>>): Date | null {
	if (!definition?.body.dueAt) return null;
	const dueAt = new Date(definition.body.dueAt);
	return Number.isNaN(dueAt.getTime()) ? null : dueAt;
}

function validateAttachments(
	attachments: z.infer<typeof attachmentSchema>,
	) {
	return attachments;
}

export const assignmentRouter = {
	create: assignmentOperatorProcedure
		.route({ method: "POST", path: "/assignment", tags: ["Assignments"], summary: "Create an assignment" })
		.input(z.object({ title: z.string().trim().min(1).max(200), body: assignmentDefinitionBodySchema }))
		.handler(async ({ input, context }) => {
			const lesson = await db.lesson.findUnique({ where: { id: input.body.lessonId }, select: { id: true } });
			if (!lesson) throw new ORPCError("NOT_FOUND", { message: "找不到指定單元。" });
			return createAssignmentDefinition({ authorId: context.user.id, title: input.title, body: input.body });
		}),

	get: protectedProcedure
		.route({ method: "GET", path: "/assignment/{pluginContentId}", tags: ["Assignments"], summary: "Get an assignment" })
		.input(z.object({ pluginContentId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const definition = await getAccessibleAssignment(input.pluginContentId, context.user.id);
			const draft = await db.assignmentDraft.findUnique({
				where: { pluginContentId_userId: { pluginContentId: definition.id, userId: context.user.id } },
				select: { id: true, content: true, contentFormat: true, updatedAt: true },
			});
			const result = await db.assignmentSubmission.findFirst({
				where: { pluginContentId: definition.id, userId: context.user.id, status: "REVIEWED" },
				orderBy: [{ revisionNumber: "desc" }, { submittedAt: "desc" }],
				include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
			});
			return {
				id: definition.id,
				title: definition.title,
				body: definition.body,
				draft,
				result: result
					? { ...result, reviews: result.reviews.map((review) => ({ ...review, feedback: review.feedback ? sanitizeAssignmentContent(review.feedback) : null })) }
					: null,
			};
		}),

	saveDraft: protectedProcedure
		.input(z.object({
			pluginContentId: z.string().min(1),
			content: contentSchema,
			contentFormat: z.enum(["PLAIN_TEXT", "RICH_TEXT"]),
		}))
		.handler(async ({ input, context }) => {
			await getAccessibleAssignment(input.pluginContentId, context.user.id);
			const content = input.content == null ? null : sanitizeAssignmentContent(input.content);
			return db.assignmentDraft.upsert({
				where: { pluginContentId_userId: { pluginContentId: input.pluginContentId, userId: context.user.id } },
				create: { pluginContentId: input.pluginContentId, userId: context.user.id, content, contentFormat: input.contentFormat },
				update: { content, contentFormat: input.contentFormat },
			});
		}),

	createUploadUrl: protectedProcedure
		.route({ method: "POST", path: "/assignment/{pluginContentId}/upload", tags: ["Assignments"], summary: "Create an assignment upload URL" })
		.input(z.object({
			pluginContentId: z.string().min(1),
			filename: z.string().trim().min(1).max(255),
			mimeType: z.string().trim().min(1).max(120),
			size: z.number().int().min(1).max(100_000_000),
		}))
		.handler(async ({ input, context }) => {
			const definition = await getAccessibleAssignment(input.pluginContentId, context.user.id);
			const extension = input.filename.toLowerCase().match(/\.([a-z0-9]{1,12})$/)?.[1] ?? "bin";
			const allowed = new Set(definition.body.allowedExtensions.map((value) => value.toLowerCase().replace(/^\./, "")));
			if (allowed.size === 0 || !allowed.has(extension)) throw new ORPCError("BAD_REQUEST", { message: "不支援的檔案格式。" });
			if (input.size > definition.body.maxFileSize) throw new ORPCError("BAD_REQUEST", { message: "檔案超過大小限制。" });
			if (definition.body.maxFiles < 1) throw new ORPCError("BAD_REQUEST", { message: "這份作業不接受檔案。" });

			const draftSubmission = await db.assignmentSubmission.findFirst({
				where: { pluginContentId: definition.id, userId: context.user.id, status: "DRAFT" },
				orderBy: { createdAt: "desc" },
				select: { id: true },
			}) ?? await db.assignmentSubmission.create({
				data: { pluginContentId: definition.id, userId: context.user.id, status: "DRAFT", revisionNumber: 1 },
				select: { id: true },
			});
			const attachmentId = randomUUID();
			const storageKey = buildAssignmentAttachmentStorageKey({ submissionId: draftSubmission.id, attachmentId, filename: input.filename });
			const upload = await getAssignmentSignedUploadUrl({ storageKey, contentType: input.mimeType });
			return { ...upload, submissionId: draftSubmission.id, attachmentId, storageKey };
		}),

	submit: protectedProcedure
		.route({ method: "POST", path: "/assignment/{pluginContentId}/submit", tags: ["Assignments"], summary: "Submit an assignment" })
		.input(z.object({
			pluginContentId: z.string().min(1),
			submissionId: z.string().min(1).nullable().optional(),
			content: contentSchema,
			contentFormat: z.enum(["PLAIN_TEXT", "RICH_TEXT"]),
			attachments: z.array(attachmentSchema).max(20).default([]),
		}))
		.handler(async ({ input, context }) => {
			const definition = await getAccessibleAssignment(input.pluginContentId, context.user.id);
			const content = input.content == null ? "" : sanitizeAssignmentContent(input.content);
			const rules = calculateSubmissionRules({
				submittedAt: new Date(),
				dueAt: getDefinitionDueAt(definition),
				content,
				minWords: definition.body.submissionType === "FILES" ? 0 : definition.body.minWords,
				maxWords: definition.body.submissionType === "FILES" ? Number.MAX_SAFE_INTEGER : definition.body.maxWords,
				fileCount: input.attachments.length,
				maxFiles: definition.body.maxFiles,
			});
			if (rules.contentError || rules.fileError) throw new ORPCError("BAD_REQUEST", { message: rules.contentError ?? rules.fileError ?? "作業內容不符合限制。" });
			if (definition.body.submissionType === "TEXT" && input.attachments.length > 0) throw new ORPCError("BAD_REQUEST", { message: "這份作業不接受檔案。" });
			if (definition.body.submissionType === "FILES" && !input.attachments.length) throw new ORPCError("BAD_REQUEST", { message: "請上傳至少一個檔案。" });

			const allowed = new Set(definition.body.allowedExtensions.map((value) => value.toLowerCase().replace(/^\./, "")));
			for (const attachment of input.attachments) {
				const extension = attachment.filename.toLowerCase().match(/\.([a-z0-9]{1,12})$/)?.[1] ?? "bin";
				if (!allowed.has(extension) || attachment.size > definition.body.maxFileSize) {
					throw new ORPCError("BAD_REQUEST", { message: "附件不符合格式或大小限制。" });
				}
			}

			return db.$transaction(async (tx) => {
				const draft = input.submissionId
					? await tx.assignmentSubmission.findFirst({ where: { id: input.submissionId, pluginContentId: definition.id, userId: context.user.id, status: "DRAFT" } })
					: null;
				const previous = await tx.assignmentSubmission.findFirst({
					where: { pluginContentId: definition.id, userId: context.user.id },
					orderBy: { revisionNumber: "desc" },
					select: { revisionNumber: true },
				});
				const revisionNumber = draft?.revisionNumber ?? (previous ? incrementRevisionNumber(previous.revisionNumber) : 1);
				const submission = draft
					? await tx.assignmentSubmission.update({
						where: { id: draft.id },
						data: { content, contentFormat: input.contentFormat, wordCount: countAssignmentWords(content), status: "SUBMITTED", revisionNumber, isLate: rules.isLate, submittedAt: new Date() },
					})
					: await tx.assignmentSubmission.create({
						data: { pluginContentId: definition.id, userId: context.user.id, content, contentFormat: input.contentFormat, wordCount: countAssignmentWords(content), status: "SUBMITTED", revisionNumber, isLate: rules.isLate, submittedAt: new Date() },
					});
				if (input.attachments.length) {
					await tx.assignmentAttachment.createMany({ data: input.attachments.map((attachment) => ({ ...validateAttachments(attachment), submissionId: submission.id })) });
				}
				return submission;
			});
		}),

	getResult: protectedProcedure
		.input(z.object({ pluginContentId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			await getAccessibleAssignment(input.pluginContentId, context.user.id);
			const submission = await db.assignmentSubmission.findFirst({
				where: { pluginContentId: input.pluginContentId, userId: context.user.id, status: "REVIEWED" },
				orderBy: [{ revisionNumber: "desc" }, { submittedAt: "desc" }],
				include: { attachments: true, reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
			});
			if (!submission) return null;
			return { ...submission, reviews: submission.reviews.map((review) => ({ ...review, feedback: review.feedback ? sanitizeAssignmentContent(review.feedback) : null })) };
		}),

	operatorList: assignmentOperatorProcedure
		.input(z.object({ pluginContentId: z.string().min(1) }))
		.handler(async ({ input }) => {
			const definition = await getAssignmentDefinition(input.pluginContentId);
			if (!definition) throw new ORPCError("NOT_FOUND");
			const submissions = await db.assignmentSubmission.findMany({
				where: { pluginContentId: definition.id, status: { in: ["SUBMITTED", "REVIEWED"] } },
				orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
				include: {
					user: { select: { id: true, name: true, email: true } },
					attachments: true,
					reviews: { orderBy: { createdAt: "desc" }, take: 1, include: { reviewer: { select: { name: true, email: true } } } },
				},
			});
			return { definition, submissions };
		}),

	review: assignmentOperatorProcedure
		.input(z.object({ submissionId: z.string().min(1), score: z.number().int().min(0).max(100).nullable().optional(), letterGrade: z.string().trim().max(20).nullable().optional(), feedback: z.string().max(20_000).nullable().optional() }))
		.handler(async ({ input, context }) => {
			const submission = await db.assignmentSubmission.findUnique({ where: { id: input.submissionId }, select: { id: true, status: true } });
			if (!submission || submission.status === "DRAFT") throw new ORPCError("NOT_FOUND");
			return db.$transaction(async (tx) => {
				const review = await tx.assignmentReview.create({
					data: { submissionId: input.submissionId, reviewerId: context.user.id, score: input.score ?? null, letterGrade: input.letterGrade?.trim() || null, feedback: input.feedback ? sanitizeAssignmentContent(input.feedback) : null },
				});
				await tx.assignmentSubmission.update({ where: { id: input.submissionId }, data: { status: "REVIEWED" } });
				return review;
			});
		}),
};
