import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { blocksToPlainText } from "@startkiter/mail";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

/** 驗證 contentJson 是合法的 BlockNote 區塊陣列（或含 blocks 陣列的物件），無效回 null */
function parseBlockJson(value: string): unknown[] | null {
	try {
		const parsed = JSON.parse(value) as unknown;
		const blocks = Array.isArray(parsed)
			? parsed
			: parsed && typeof parsed === "object" && Array.isArray((parsed as { blocks?: unknown }).blocks)
				? (parsed as { blocks: unknown[] }).blocks
				: null;
		if (!blocks) return null;
		// 每個元素必須是含字串 type 的物件（BlockNote 區塊最基本形狀）
		const isBlockLike = (item: unknown) =>
			!!item && typeof item === "object" && !Array.isArray(item) && typeof (item as { type?: unknown }).type === "string";
		return blocks.every(isBlockLike) ? blocks : null;
	} catch {
		return null;
	}
}

const blockJsonSchema = z.string().max(500_000).refine((value) => parseBlockJson(value) !== null, {
	message: "contentJson must be a JSON array of editor blocks",
});

const input = z.object({
	courseId: z.string().trim().min(1),
	enabled: z.boolean(),
	subjectTemplate: z.string().trim().min(1).max(998),
	markdownTemplate: z.string().max(50_000),
	contentJson: blockJsonSchema.optional(),
});

export const updateWelcomeEmailSettings = courseOperatorProcedure
	.route({
		method: "POST",
		path: "/course/email-settings/welcome",
		tags: ["Course email"],
		summary: "Update a course welcome email template",
	})
	.input(input)
	.handler(async ({ input: values }) => {
		const course = await db.course.findUnique({ where: { id: values.courseId }, select: { id: true } });
		if (!course) throw new ORPCError("NOT_FOUND");

		const markdownTemplate =
			values.contentJson !== undefined
				? blocksToPlainText(values.contentJson) || values.markdownTemplate
				: values.markdownTemplate;

		const createData = {
			courseId: values.courseId,
			enabled: values.enabled,
			subjectTemplate: values.subjectTemplate,
			markdownTemplate,
			...(values.contentJson !== undefined ? { contentJson: values.contentJson } : {}),
		};

		const updateData = {
			enabled: values.enabled,
			subjectTemplate: values.subjectTemplate,
			markdownTemplate,
			...(values.contentJson !== undefined ? { contentJson: values.contentJson } : {}),
		};

		return {
			setting: await db.courseWelcomeEmail.upsert({
				where: { courseId: values.courseId },
				create: createData,
				update: updateData,
			}),
		};
	});
