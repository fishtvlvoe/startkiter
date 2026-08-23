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

export type BlockDefinition<T extends Record<string, unknown> = Record<string, unknown>> = {
	name: string;
	propsSchema: z.ZodType<T>;
	component: ComponentType<T>;
};

const classNameSchema = z.string().optional();
const reactNodeSchema = z.unknown();

const timelineSyncPropsSchema = z
	.object({
		at: z.union([z.string(), z.number()]),
		end: z.union([z.string(), z.number()]).optional(),
		title: reactNodeSchema.optional(),
		currentTime: z.number().optional(),
		autoScroll: z.boolean().optional(),
		children: reactNodeSchema.optional(),
		className: classNameSchema,
	})
	.passthrough();

const conceptComparePropsSchema = z
	.object({
		tabs: z.array(
			z.object({
				title: reactNodeSchema,
				description: reactNodeSchema.optional(),
				code: z.string().optional(),
				visual: reactNodeSchema.optional(),
			}),
		),
		defaultIndex: z.number().optional(),
		className: classNameSchema,
	})
	.passthrough();

const microSandboxPropsSchema = z
	.object({
		template: z.string().optional(),
		initialProps: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
		controls: z.array(
			z.object({
				name: z.string(),
				label: reactNodeSchema.optional(),
				type: z.enum(["slider", "select", "text"]),
				default: z.union([z.string(), z.number()]),
				min: z.number().optional(),
				max: z.number().optional(),
				step: z.number().optional(),
				options: z
					.array(z.union([z.string(), z.object({ value: z.string(), label: z.string() })]))
					.optional(),
			}),
		),
		className: classNameSchema,
	})
	.passthrough();

const workflowSorterPropsSchema = z
	.object({
		blockId: z.string().optional(),
		items: z.array(z.union([z.string(), z.object({ id: z.string(), label: reactNodeSchema })])),
		correctOrder: z.array(z.string()),
		explanation: reactNodeSchema.optional(),
		className: classNameSchema,
	})
	.passthrough();

const instantQuizPropsSchema = z
	.object({
		blockId: z.string().optional(),
		question: reactNodeSchema,
		options: z.array(reactNodeSchema),
		answerIndex: z.union([z.number(), z.array(z.number())]),
		explanation: reactNodeSchema,
		multiple: z.boolean().optional(),
		className: classNameSchema,
	})
	.passthrough();

const teacherAvatarPropsSchema = z
	.object({
		mood: z.enum(["explaining", "encouraging", "thinking"]),
		caption: reactNodeSchema,
		at: z.union([z.string(), z.number()]).optional(),
		className: classNameSchema,
	})
	.passthrough();

const dialogueWindowPropsSchema = z
	.object({
		prompts: z.array(z.object({ question: reactNodeSchema, response: reactNodeSchema })),
		avatar: z.boolean().optional(),
		initialIndex: z.number().optional(),
		className: classNameSchema,
	})
	.passthrough();

export const webContainerSandboxPropsSchema = z
	.object({
		blockId: z.string(),
		files: z.record(z.string(), z.string()),
		testCommand: z.string().optional(),
		hints: z.array(z.string()),
		milestone: z.boolean().optional(),
	})
	.passthrough();

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
