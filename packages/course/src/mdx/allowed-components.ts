export const LESSON_MDX_COMPONENTS = [
	"TimelineSync",
	"ConceptCompare",
	"MicroSandbox",
	"WorkflowSorter",
	"InstantQuiz",
	"TeacherAvatar",
	"DialogueWindow",
] as const;

export type LessonMdxComponentName = (typeof LESSON_MDX_COMPONENTS)[number];

export const LESSON_MDX_COMPONENT_SET = new Set<string>(LESSON_MDX_COMPONENTS);
