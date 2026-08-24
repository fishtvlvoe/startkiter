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
import { db, type Prisma } from "@startkiter/database";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { protectedProcedure } from "../../orpc/procedures";
import { userCanAccessCourseId } from "../course/lib/course-access";
import { courseOperatorProcedure } from "../course/lib/course-operator";
import {
	assignmentUploadObjectMatches,
	buildAssignmentAttachmentStorageKey,
	getAssignmentSignedUploadUrl,
	isAssignmentStorageConfigured,
} from "./assignment-upload";
import {
	cleanupExpiredAssignmentUploadIntents,
	decodeAssignmentSubmissionCursor,
	encodeAssignmentSubmissionCursor,
} from "./assignment-lifecycle";
import { shouldApplyAssignmentDraftRevision } from "./assignment-draft";

const contentSchema = z.string().max(200_000).nullable().optional();
const attachmentSchema = z.object({
	attachmentId: z.string().uuid(),
	filename: z.string().trim().min(1).max(255),
	mimeType: z.string().trim().min(1).max(120),
	size: z.number().int().min(1).max(100_000_000),
	storageKey: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/),
});

const assignmentOperatorProcedure = courseOperatorProcedure;

function isUniqueConstraintError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

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
	{ attachmentId: _attachmentId, ...attachments }: z.infer<typeof attachmentSchema>,
	) {
	return attachments;
}

export const assignmentRouter = {
	create: assignmentOperatorProcedure
		.route({ method: "POST", path: "/assignment", tags: ["Assignments"], summary: "Create an assignment" })
		.input(z.object({ title: z.string().trim().min(1).max(200), body: assignmentDefinitionBodySchema }))
		.handler(async ({ input, context }) => {
			const lesson = await db.lesson.findFirst({ where: { id: input.body.lessonId, status: "PUBLISHED" }, select: { id: true } });
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
				select: { id: true, content: true, contentFormat: true, revision: true, updatedAt: true },
			});
			const pendingUpload = await db.assignmentUploadIntent.findFirst({
				where: { pluginContentId: definition.id, userId: context.user.id, status: { in: ["PENDING", "UPLOADED"] }, expiresAt: { gt: new Date() }, submission: { status: "DRAFT" } },
				orderBy: { createdAt: "desc" },
				select: { id: true, submissionId: true, filename: true, mimeType: true, size: true, storageKey: true },
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
				pendingUpload: pendingUpload ? { attachmentId: pendingUpload.id, submissionId: pendingUpload.submissionId, filename: pendingUpload.filename, mimeType: pendingUpload.mimeType, size: pendingUpload.size, storageKey: pendingUpload.storageKey } : null,
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
			revision: z.number().int().min(1).max(1_000_000),
		}))
		.handler(async ({ input, context }) => {
			await getAccessibleAssignment(input.pluginContentId, context.user.id);
			const content = input.content == null ? null : sanitizeAssignmentContent(input.content);
			const where = { pluginContentId_userId: { pluginContentId: input.pluginContentId, userId: context.user.id } };
			const existing = await db.assignmentDraft.findUnique({ where, select: { revision: true } });
			if (existing && !shouldApplyAssignmentDraftRevision(existing.revision, input.revision)) return db.assignmentDraft.findUniqueOrThrow({ where });
			if (!existing) {
				try {
					return await db.assignmentDraft.create({ data: { pluginContentId: input.pluginContentId, userId: context.user.id, content, contentFormat: input.contentFormat, revision: input.revision } });
				} catch (error) {
					if (!isUniqueConstraintError(error)) throw error;
				}
			}
			await db.assignmentDraft.updateMany({ where: { ...where, revision: { lt: input.revision } }, data: { content, contentFormat: input.contentFormat, revision: input.revision } });
			return db.assignmentDraft.findUniqueOrThrow({ where });
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
			const attachmentId = randomUUID();
			await cleanupExpiredAssignmentUploadIntents({ pluginContentId: definition.id, userId: context.user.id });
			const uploadIntent = await db.$transaction(async (tx) => {
				// Serialize intent quota and revision allocation for this learner/assignment pair.
				await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`assignment-upload:${definition.id}:${context.user.id}`}, 0))`;
				const pendingIntentCount = await tx.assignmentUploadIntent.count({
					where: { pluginContentId: definition.id, userId: context.user.id, status: { in: ["PENDING", "UPLOADED"] }, expiresAt: { gt: new Date() }, submission: { status: "DRAFT" } },
				});
				const maxPendingIntents = Math.max(definition.body.maxFiles * 2, 2);
				if (pendingIntentCount >= maxPendingIntents) {
					throw new ORPCError("BAD_REQUEST", { message: "待上傳附件過多，請完成或重新整理目前的上傳。" });
				}

				const draftSubmission = await tx.assignmentSubmission.findFirst({
					where: { pluginContentId: definition.id, userId: context.user.id, status: "DRAFT" },
					orderBy: { createdAt: "desc" },
					select: { id: true },
				});
				const previousSubmission = draftSubmission ? null : await tx.assignmentSubmission.findFirst({
					where: { pluginContentId: definition.id, userId: context.user.id },
					orderBy: { revisionNumber: "desc" },
					select: { revisionNumber: true },
				});
				const submission = draftSubmission ?? await tx.assignmentSubmission.create({
					data: {
						pluginContentId: definition.id,
						userId: context.user.id,
						status: "DRAFT",
						revisionNumber: previousSubmission ? incrementRevisionNumber(previousSubmission.revisionNumber) : 1,
					},
					select: { id: true },
				});
				const storageKey = buildAssignmentAttachmentStorageKey({ submissionId: submission.id, attachmentId, filename: input.filename });
				await tx.assignmentUploadIntent.create({
					data: {
						id: attachmentId,
						pluginContentId: definition.id,
						submissionId: submission.id,
						userId: context.user.id,
						filename: input.filename,
						mimeType: input.mimeType,
						size: input.size,
						storageKey,
						expiresAt: new Date(Date.now() + 60_000),
					},
				});
				return { submissionId: submission.id, storageKey };
			});
			const storageKey = uploadIntent.storageKey;
			const upload = await getAssignmentSignedUploadUrl({ storageKey, contentType: input.mimeType, maxSize: definition.body.maxFileSize, size: input.size });
			return { ...upload, submissionId: uploadIntent.submissionId, attachmentId, storageKey };
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
			if (input.attachments.length) {
				if (!input.submissionId) throw new ORPCError("BAD_REQUEST", { message: "附件上傳工作階段已失效，請重新上傳。" });
				const expectedIntentStatus = isAssignmentStorageConfigured() ? "PENDING" : "UPLOADED";
				const intents = await db.assignmentUploadIntent.findMany({
					where: { id: { in: input.attachments.map((attachment) => attachment.attachmentId) }, pluginContentId: definition.id, submissionId: input.submissionId, userId: context.user.id, status: expectedIntentStatus, expiresAt: { gt: new Date() } },
					select: { id: true, filename: true, mimeType: true, size: true, storageKey: true },
				});
				if (intents.length !== input.attachments.length) throw new ORPCError("BAD_REQUEST", { message: "附件上傳工作階段已失效，請重新上傳。" });
				const intentById = new Map(intents.map((intent) => [intent.id, intent]));
				for (const attachment of input.attachments) {
					const intent = intentById.get(attachment.attachmentId);
					if (!intent || intent.filename !== attachment.filename || intent.mimeType !== attachment.mimeType || intent.size !== attachment.size || intent.storageKey !== attachment.storageKey) {
						throw new ORPCError("BAD_REQUEST", { message: "附件上傳資料不一致。" });
					}
				}
			}
			for (const attachment of input.attachments) {
				const extension = attachment.filename.toLowerCase().match(/\.([a-z0-9]{1,12})$/)?.[1] ?? "bin";
				if (!allowed.has(extension) || attachment.size > definition.body.maxFileSize) {
					throw new ORPCError("BAD_REQUEST", { message: "附件不符合格式或大小限制。" });
				}
				if (isAssignmentStorageConfigured() && !(await assignmentUploadObjectMatches({ storageKey: attachment.storageKey, contentType: attachment.mimeType, size: attachment.size }))) {
					throw new ORPCError("BAD_REQUEST", { message: "附件尚未完成上傳，請重新上傳。" });
				}
			}

			try {
				return await db.$transaction(async (tx) => {
				const draft = await tx.assignmentSubmission.findFirst({
					where: { ...(input.submissionId ? { id: input.submissionId } : {}), pluginContentId: definition.id, userId: context.user.id, status: "DRAFT" },
					orderBy: { createdAt: "desc" },
				});
				if (input.submissionId && !draft) throw new ORPCError("CONFLICT", { message: "這份作業草稿已不存在或正在送出，請重新整理頁面。" });
				const previous = await tx.assignmentSubmission.findFirst({
					where: { pluginContentId: definition.id, userId: context.user.id },
					orderBy: { revisionNumber: "desc" },
					select: { revisionNumber: true },
				});
				const revisionNumber = draft?.revisionNumber ?? (previous ? incrementRevisionNumber(previous.revisionNumber) : 1);
				let submission;
				if (draft) {
					const updated = await tx.assignmentSubmission.updateMany({
						where: { id: draft.id, status: "DRAFT" },
						data: { content, contentFormat: input.contentFormat, wordCount: countAssignmentWords(content), status: "SUBMITTED", revisionNumber, isLate: rules.isLate, submittedAt: new Date() },
					});
					if (updated.count !== 1) throw new ORPCError("CONFLICT", { message: "這份作業正在送出，請重新整理頁面。" });
					submission = await tx.assignmentSubmission.findUniqueOrThrow({ where: { id: draft.id } });
				} else {
					submission = await tx.assignmentSubmission.create({
						data: { pluginContentId: definition.id, userId: context.user.id, content, contentFormat: input.contentFormat, wordCount: countAssignmentWords(content), status: "SUBMITTED", revisionNumber, isLate: rules.isLate, submittedAt: new Date() },
					});
				}
				if (input.attachments.length) {
						if (!submission.id || !input.submissionId) throw new ORPCError("BAD_REQUEST", { message: "附件上傳工作階段已失效，請重新上傳。" });
						const intentIds = input.attachments.map((attachment) => attachment.attachmentId);
						const intents = await tx.assignmentUploadIntent.findMany({
							where: {
								id: { in: intentIds },
								pluginContentId: definition.id,
								submissionId: submission.id,
								userId: context.user.id,
								status: isAssignmentStorageConfigured() ? "PENDING" : "UPLOADED",
								expiresAt: { gt: new Date() },
							},
						});
						if (intents.length !== input.attachments.length) throw new ORPCError("BAD_REQUEST", { message: "附件上傳工作階段已失效，請重新上傳。" });
						const intentById = new Map(intents.map((intent) => [intent.id, intent]));
						for (const attachment of input.attachments) {
							const intent = intentById.get(attachment.attachmentId);
							if (!intent || intent.filename !== attachment.filename || intent.mimeType !== attachment.mimeType || intent.size !== attachment.size || intent.storageKey !== attachment.storageKey) {
								throw new ORPCError("BAD_REQUEST", { message: "附件上傳資料不一致。" });
							}
						}
						const expectedIntentStatus = isAssignmentStorageConfigured() ? "PENDING" : "UPLOADED";
						const usedIntents = await tx.assignmentUploadIntent.updateMany({ where: { id: { in: intentIds }, status: expectedIntentStatus }, data: { status: "USED" } });
						if (usedIntents.count !== input.attachments.length) throw new ORPCError("CONFLICT", { message: "附件上傳工作階段已被使用，請重新上傳。" });
					}
					if (input.attachments.length) {
						await tx.assignmentAttachment.createMany({ data: input.attachments.map((attachment) => ({ id: attachment.attachmentId, ...validateAttachments(attachment), submissionId: submission.id })) });
					} else {
						await tx.assignmentUploadIntent.updateMany({ where: { submissionId: submission.id, status: { in: ["PENDING", "UPLOADED"] } }, data: { status: "CANCELLED" } });
					}
				return submission;
				});
			} catch (error) {
				if (isUniqueConstraintError(error)) throw new ORPCError("CONFLICT", { message: "這份作業正在送出，請重新整理頁面。" });
				throw error;
			}
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
		.input(z.object({ pluginContentId: z.string().min(1), limit: z.number().int().min(1).max(100).default(50), cursor: z.string().trim().min(1).max(1000).optional() }))
		.handler(async ({ input }) => {
			const definition = await getAssignmentDefinition(input.pluginContentId);
			if (!definition) throw new ORPCError("NOT_FOUND");
			const cursor = input.cursor ? decodeAssignmentSubmissionCursor(input.cursor) : null;
			if (input.cursor && !cursor) throw new ORPCError("BAD_REQUEST", { message: "提交清單游標無效。" });
			if (cursor && cursor.pluginContentId !== definition.id) throw new ORPCError("BAD_REQUEST", { message: "提交清單游標不屬於這份作業。" });
			const cursorWhere: Prisma.AssignmentSubmissionWhereInput | undefined = cursor
				? {
					OR: [
						{ submittedAt: { lt: new Date(cursor.submittedAt) } },
						{ submittedAt: new Date(cursor.submittedAt), createdAt: { lt: new Date(cursor.createdAt) } },
						{ submittedAt: new Date(cursor.submittedAt), createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
					],
				}
				: undefined;
			const submissions = await db.assignmentSubmission.findMany({
				where: { pluginContentId: definition.id, status: { in: ["SUBMITTED", "REVIEWED"] }, submittedAt: { not: null }, ...(cursorWhere ?? {}) },
				orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
				take: input.limit + 1,
				include: {
					user: { select: { id: true, name: true, email: true } },
					attachments: true,
					reviews: { orderBy: { createdAt: "desc" }, take: 1, include: { reviewer: { select: { name: true, email: true } } } },
				},
			});
			const hasNextPage = submissions.length > input.limit;
			const page = hasNextPage ? submissions.slice(0, input.limit) : submissions;
			const last = page[page.length - 1];
			return {
				definition,
				submissions: page,
				nextCursor: hasNextPage && last?.submittedAt
					? encodeAssignmentSubmissionCursor({ pluginContentId: definition.id, id: last.id, submittedAt: last.submittedAt.toISOString(), createdAt: last.createdAt.toISOString() })
					: null,
			};
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
