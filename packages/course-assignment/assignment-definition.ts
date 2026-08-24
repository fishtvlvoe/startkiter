import { db } from "@startkiter/database";
import { z } from "zod";

import { sanitizeAssignmentContent } from "./sanitize-html";

const PLUGIN_ID = "assignment" as const;
const CONTENT_TYPE = "assignment-definition" as const;

export const assignmentDefinitionBodySchema = z.object({
	lessonId: z.string().trim().min(1),
	description: z.string().max(20_000).default(""),
	submissionType: z.enum(["TEXT", "FILES", "TEXT_AND_FILES"]),
	editorMode: z.enum(["PLAIN_TEXT", "RICH_TEXT"]),
	minWords: z.number().int().min(0).max(100_000).default(0),
	maxWords: z.number().int().min(1).max(100_000).default(10_000),
	maxImages: z.number().int().min(0).max(100).default(0),
	maxImageSize: z.number().int().positive().max(50_000_000).default(5_000_000),
	maxFiles: z.number().int().min(0).max(20).default(0),
	maxFileSize: z.number().int().positive().max(100_000_000).default(10_000_000),
	allowedExtensions: z.array(z.string().regex(/^[a-z0-9]+$/i)).max(50).default([]),
	gradingType: z.enum(["SCORE", "LETTER"]),
	passingScore: z.number().int().min(0).max(100).default(60),
	dueAt: z.string().datetime().nullable().optional(),
}).superRefine((body, ctx) => {
	if (body.maxWords < body.minWords) {
		ctx.addIssue({ code: "custom", path: ["maxWords"], message: "maxWords must be greater than or equal to minWords" });
	}
	if (body.submissionType === "TEXT" && body.maxFiles !== 0) {
		ctx.addIssue({ code: "custom", path: ["maxFiles"], message: "TEXT assignments cannot accept files" });
	}
});

export type AssignmentDefinitionBody = z.infer<typeof assignmentDefinitionBodySchema>;

export type CreateAssignmentDefinitionInput = {
	authorId: string;
	title: string;
	body: AssignmentDefinitionBody;
};

export async function createAssignmentDefinition(input: CreateAssignmentDefinitionInput) {
	const body = assignmentDefinitionBodySchema.parse({
		...input.body,
		description: sanitizeAssignmentContent(input.body.description),
	});

	return db.pluginContent.create({
		data: {
			pluginId: PLUGIN_ID,
			type: CONTENT_TYPE,
			title: input.title.trim(),
			body,
			authorId: input.authorId,
		},
	});
}

export async function getAssignmentDefinition(pluginContentId: string) {
	const record = await db.pluginContent.findFirst({
		where: { id: pluginContentId, pluginId: PLUGIN_ID, type: CONTENT_TYPE },
	});

	if (!record) return null;

	const parsedBody = assignmentDefinitionBodySchema.parse(record.body);
	return {
		...record,
		body: assignmentDefinitionBodySchema.parse({
			...parsedBody,
			description: sanitizeAssignmentContent(parsedBody.description),
		}),
	};
}

export async function getAssignmentDefinitionByLessonId(lessonId: string) {
	const records = await db.pluginContent.findMany({
		where: { pluginId: PLUGIN_ID, type: CONTENT_TYPE },
		orderBy: { createdAt: "asc" },
	});

	for (const record of records) {
		const body = assignmentDefinitionBodySchema.safeParse(record.body);
		if (body.success && body.data.lessonId === lessonId) {
			return {
				...record,
				body: assignmentDefinitionBodySchema.parse({
					...body.data,
					description: sanitizeAssignmentContent(body.data.description),
				}),
			};
		}
	}

	return null;
}
