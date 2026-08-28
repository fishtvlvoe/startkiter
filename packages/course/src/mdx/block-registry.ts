import { z } from "zod";
import type { ComponentType } from "react";

import {
	ConceptCompare,
	DialogueWindow,
	InstantQuiz,
	MicroSandbox,
	TeacherAvatar,
	TimelineSync,
	WebContainerSandbox,
	WorkflowSorter,
} from "../components/interactive";
import type { Mission } from "../course-pack/schema";
import { resolveSurfaceBlock } from "../course-pack/surface-block-map";

export type BlockDefinition<T extends Record<string, unknown> = Record<string, unknown>> = {
	name: string;
	propsSchema: z.ZodType<T>;
	component: ComponentType<T>;
};

const classNameSchema = z.string().optional();
const renderableValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const timelineSyncPropsSchema = z
	.object({
		at: z.union([z.string(), z.number()]),
		end: z.union([z.string(), z.number()]).optional(),
		title: renderableValueSchema.optional(),
		currentTime: z.number().optional(),
		autoScroll: z.boolean().optional(),
		children: renderableValueSchema.optional(),
		className: classNameSchema,
	})
	.strict();

const conceptComparePropsSchema = z
	.object({
		tabs: z.array(
			z
				.object({
					title: renderableValueSchema,
					description: renderableValueSchema.optional(),
					code: z.string().optional(),
					visual: renderableValueSchema.optional(),
				})
				.strict(),
		),
		defaultIndex: z.number().optional(),
		className: classNameSchema,
	})
	.strict();

const microSandboxPropsSchema = z
	.object({
		template: z.string().optional(),
		initialProps: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
		controls: z.array(
			z
				.object({
				name: z.string(),
				label: renderableValueSchema.optional(),
				type: z.enum(["slider", "select", "text"]),
				default: z.union([z.string(), z.number()]),
				min: z.number().optional(),
				max: z.number().optional(),
				step: z.number().optional(),
				options: z
					.array(
						z.union([
							z.string(),
							z.object({ value: z.string(), label: z.string() }).strict(),
						]),
					)
					.optional(),
				})
				.strict(),
		),
		className: classNameSchema,
	})
	.strict();

const workflowSorterPropsSchema = z
	.object({
		blockId: z.string().optional(),
		items: z.array(
			z.union([z.string(), z.object({ id: z.string(), label: renderableValueSchema }).strict()]),
		),
		correctOrder: z.array(z.string()),
		explanation: renderableValueSchema.optional(),
		className: classNameSchema,
	})
	.strict();

const instantQuizPropsSchema = z
	.object({
		blockId: z.string().optional(),
		question: renderableValueSchema,
		options: z.array(renderableValueSchema).min(1),
		answerIndex: z.union([
			z.number().int().nonnegative(),
			z.array(z.number().int().nonnegative()).min(1),
		]),
		explanation: renderableValueSchema,
		multiple: z.boolean().optional(),
		className: classNameSchema,
	})
	.strict()
	.superRefine((props, context) => {
		const answerIndices = typeof props.answerIndex === "number" ? [props.answerIndex] : props.answerIndex;
		if (answerIndices.some((index) => index >= props.options.length)) {
			context.addIssue({
				code: "custom",
				path: ["answerIndex"],
				message: "answerIndex 必須對應現有選項。",
			});
		}
	});

const teacherAvatarPropsSchema = z
	.object({
		mood: z.enum(["explaining", "encouraging", "thinking"]),
		caption: renderableValueSchema,
		at: z.union([z.string(), z.number()]).optional(),
		className: classNameSchema,
	})
	.strict();

const dialogueWindowPropsSchema = z
	.object({
		prompts: z.array(
			z
				.object({ question: renderableValueSchema, response: renderableValueSchema })
				.strict(),
		),
		avatar: z.boolean().optional(),
		initialIndex: z.number().optional(),
		className: classNameSchema,
	})
	.strict();

export const webContainerSandboxPropsSchema = z
	.object({
		blockId: z.string(),
		files: z.record(z.string(), z.string()),
		testCommand: z.string().optional(),
		hints: z.array(z.string()),
		milestone: z.boolean().optional(),
	})
	.strict();

export const BLOCK_REGISTRY: BlockDefinition<any>[] = [
	{ name: "TimelineSync", propsSchema: timelineSyncPropsSchema, component: TimelineSync },
	{ name: "ConceptCompare", propsSchema: conceptComparePropsSchema, component: ConceptCompare },
	{ name: "MicroSandbox", propsSchema: microSandboxPropsSchema, component: MicroSandbox },
	{ name: "WorkflowSorter", propsSchema: workflowSorterPropsSchema, component: WorkflowSorter },
	{ name: "InstantQuiz", propsSchema: instantQuizPropsSchema, component: InstantQuiz },
	{ name: "TeacherAvatar", propsSchema: teacherAvatarPropsSchema, component: TeacherAvatar },
	{ name: "DialogueWindow", propsSchema: dialogueWindowPropsSchema, component: DialogueWindow },
	{
		name: "WebContainerSandbox",
		propsSchema: webContainerSandboxPropsSchema,
		component: WebContainerSandbox,
	},
];

export function isRegisteredBlockName(name: string): boolean {
	return BLOCK_REGISTRY.some((block) => block.name === name);
}

export type MissionBlockResolution =
	| { ok: true; blockName: string; props: Record<string, unknown> }
	| { ok: false; error: string };

function missionActionProps(action: Mission["action"], blockId: string): Record<string, unknown> {
	switch (action.surface) {
		case "code_editor":
		case "terminal":
			return {
				blockId,
				files: { "mission-instructions.txt": action.instructions.join("\n") },
				hints: [],
			};
		case "structured_form":
			return {
				prompts: action.fields.map((field) => ({
					question: `${field.label} (${field.inputType})`,
					response: field.key,
				})),
			};
		case "embedded_tool":
			return {
				tabs: [
					{
						title: action.mode,
						description: action.url ?? "未提供工具網址",
					},
				],
			};
	}
}

export function resolveMissionBlock(
	action: Mission["action"],
	blockId = "mission-action",
): MissionBlockResolution {
	const surface = resolveSurfaceBlock(action.surface);
	if (!surface.ok) {
		return surface;
	}

	const definition = BLOCK_REGISTRY.find((block) => block.name === surface.blockName);
	if (!definition) {
		return {
			ok: false,
			error: `Unregistered rendering block: ${surface.blockName}`,
		};
	}

	const props = missionActionProps(action, blockId);
	if (!definition.propsSchema.safeParse(props).success) {
		return {
			ok: false,
			error: `Invalid props for rendering block: ${surface.blockName}`,
		};
	}

	return { ok: true, blockName: surface.blockName, props };
}
