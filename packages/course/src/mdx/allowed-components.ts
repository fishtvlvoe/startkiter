import { BLOCK_REGISTRY } from "./block-registry";

export const LESSON_MDX_COMPONENTS = BLOCK_REGISTRY.map((block) => block.name) as readonly string[];

export type LessonMdxComponentName = (typeof LESSON_MDX_COMPONENTS)[number];

export const LESSON_MDX_COMPONENT_SET = new Set<string>(LESSON_MDX_COMPONENTS);
