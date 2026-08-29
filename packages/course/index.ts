export { canAccessCourse, canAccessCourseId } from "./access";
export type {
	BundleCourseAccessReader,
	CourseAccessOrderRow,
	CourseAccessReader,
} from "./access";
export {
	getLesson,
	listLessons,
	toPublicLessonMeta,
} from "./catalog";
export type { LessonDetail, LessonSummary } from "./catalog";
export { decideLessonPlayback } from "./playback";
export type { PlaybackDecision } from "./playback";
export {
	getLineCommunityInvite,
	resolveLineCommunityInviteUrl,
} from "./line-invite";
export type { LineInviteAccessReader, LineInviteResult } from "./line-invite";
export {
	ConceptCompare,
	DialogueWindow,
	InstantQuiz,
	MicroSandbox,
	TeacherAvatar,
	TimelineSync,
	WebContainerSandbox,
	WorkflowSorter,
	isWorkflowOrderCorrect,
	moveWorkflowItem,
} from "./src/components/interactive";
export type {
	ConceptCompareProps,
	ConceptCompareTab,
	DialoguePrompt,
	DialogueWindowProps,
	InstantQuizProps,
	InstantQuizResult,
	MicroSandboxProps,
	SandboxControl,
	SandboxOption,
	SandboxValue,
	SandboxValues,
	TeacherAvatarProps,
	TeacherMood,
	TimelineSyncProps,
	WebContainerSandboxProps,
	WorkflowItem,
	WorkflowSorterProps,
	WorkflowSortResult,
} from "./src/components/interactive";
export { isTimeActive, parseTimecode, useTimeSync } from "./src/hooks/use-time-sync";
export type { Timecode, TimeSyncOptions, TimeSyncState } from "./src/hooks/use-time-sync";
export { LessonMdx } from "./src/mdx/LessonMdx";
export type { LessonMdxProps } from "./src/mdx/LessonMdx";
export { inspectMdxSource } from "./src/mdx/inspect-mdx-source";
export type { MdxInspectResult } from "./src/mdx/inspect-mdx-source";
export { extractLessonBlockIds } from "./src/mdx/extract-lesson-block-ids";
export { FluentPlayer } from "./src/player/FluentPlayer";
export type { FluentPlayerSource } from "./src/player/FluentPlayer";
export { WatermarkOverlay, maskEmail } from "./src/player/watermark-overlay";
export type {
	WatermarkOverlayProps,
	WatermarkPlayerSettings,
} from "./src/player/watermark-overlay";
export { courseModuleDescriptor } from "./src/config/modules";
export type {
	ModuleDescriptor,
	ModuleMountPoints,
	ModuleNavigation,
} from "./src/config/modules";
export { BUNNY_API_KEY_FIELD } from "./src/course-pack/checks/bunny-zone-created";
