import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { blocksToPlainText } from "@startkiter/mail";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

const input = z.object({
	courseId: z.string().trim().min(1),
	enabled: z.boolean(),
	subjectTemplate: z.string().trim().min(1).max(998),
	markdownTemplate: z.string().max(50_000),
	contentJson: z.string().max(500_000).optional(),
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
