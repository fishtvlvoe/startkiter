import { z } from "zod";

const nonEmptyText = z.string().trim().min(1, "必填");

const actionSchema = z.discriminatedUnion("surface", [
	z.object({
		surface: z.literal("code_editor"),
		instructions: z.array(nonEmptyText).min(1, "至少需要一個操作步驟"),
	}).strict(),
	z.object({
		surface: z.literal("terminal"),
		instructions: z.array(nonEmptyText).min(1, "至少需要一個操作步驟"),
	}).strict(),
	z.object({
		surface: z.literal("structured_form"),
		fields: z.array(
			z.object({
				key: nonEmptyText,
				label: nonEmptyText,
				inputType: z.enum(["text", "number", "url"]),
				required: z.boolean(),
			}).strict(),
		).min(1, "至少需要一個欄位"),
	}).strict(),
	z.object({
		surface: z.literal("embedded_tool"),
		url: nonEmptyText.optional(),
		mode: z.enum(["iframe", "copy_command"]),
	}).strict(),
]);

const evaluatorSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("deterministic"),
		adapter: nonEmptyText,
		criteria: z.array(nonEmptyText).min(1, "至少需要一項判定條件"),
	}).strict(),
	z.object({
		type: z.literal("external_check"),
		check_id: nonEmptyText,
		params: z.record(z.string(), z.string()),
		poll_interval_seconds: z.number().int().positive(),
		timeout_seconds: z.number().int().positive(),
	}).strict(),
]);

const feedbackSchema = z.object({
	success: nonEmptyText,
	failure: nonEmptyText,
}).strict();

const consequenceSchema = z.object({
	success: nonEmptyText,
	failure: nonEmptyText,
}).strict();

const recoveryRuleSchema = z.object({
	attempt: z.number().int().positive(),
	level: z.enum(["L1", "L2", "L3", "teacher"]),
	hint: nonEmptyText,
	escalation: nonEmptyText.optional(),
}).strict();

const recoverySchema = z.array(recoveryRuleSchema)
	.min(1, "至少需要一條救援規則")
	.superRefine((rules, context) => {
		const attempts = new Set<number>();

		for (const [index, rule] of rules.entries()) {
			if (attempts.has(rule.attempt)) {
				context.addIssue({
					code: "custom",
					path: [index, "attempt"],
					message: "attempt 不可重複",
				});
			}
			attempts.add(rule.attempt);

			const previous = rules[index - 1];
			if (previous && rule.attempt <= previous.attempt) {
				context.addIssue({
					code: "custom",
					path: [index, "attempt"],
					message: "attempt 必須由小到大排序",
				});
			}
		}
	});

const evidenceSchema = z.object({
	type: z.enum(["source_code", "test_report", "artifact", "reflection"]),
	label: nonEmptyText,
	required: z.boolean(),
}).strict();

const missionSchema = z.object({
	id: nonEmptyText,
	title: nonEmptyText,
	goal: nonEmptyText,
	action: actionSchema,
	evaluator: evaluatorSchema,
	feedback: feedbackSchema,
	consequence: consequenceSchema,
	recovery: recoverySchema,
	evidence: z.array(evidenceSchema).min(1, "至少需要一項學習證據"),
}).strict().superRefine((mission, context) => {
	if (!mission.evidence.some((evidence) => evidence.required)) {
		context.addIssue({
			code: "custom",
			path: ["evidence"],
			message: "至少需要一項必填學習證據",
		});
	}
});

export const CoursePackSchema = z.object({
	id: nonEmptyText,
	title: nonEmptyText,
	learning_outcomes: z.array(nonEmptyText).min(1, "至少需要一項學習成果"),
	missions: z.array(missionSchema).min(1, "至少需要一個 Mission"),
}).strict();

export const CoursePackEnvelopeSchema = z.object({
	schema_version: z.literal("1.0.0"),
	target_runtime: z.literal("startkiter"),
	course_pack: CoursePackSchema,
}).strict();

export type CoursePack = z.infer<typeof CoursePackSchema>;
export type CoursePackEnvelope = z.infer<typeof CoursePackEnvelopeSchema>;
export type Mission = CoursePack["missions"][number];
export type RecoveryRule = Mission["recovery"][number];
export type ValidationError = { path: string; message: string };

export type CoursePackValidationResult =
	| { success: true; data: CoursePackEnvelope; errors: [] }
	| { success: false; data: undefined; errors: ValidationError[] };

export function validateCoursePackEnvelope(input: unknown): CoursePackValidationResult {
	const result = CoursePackEnvelopeSchema.safeParse(input);

	if (result.success) {
		return { success: true, data: result.data, errors: [] };
	}

	return {
		success: false,
		data: undefined,
		errors: result.error.issues.map((issue) => ({
			path: issue.path.length > 0 ? issue.path.join(".") : "course_pack",
			message: issue.message,
		})),
	};
}
