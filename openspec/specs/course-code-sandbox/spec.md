# course-code-sandbox Specification

## Purpose

TBD - created by archiving change 'course-studio-upgrade'. Update Purpose after archive.

## Requirements

### Requirement: Students execute real Node.js code inside a browser-based WebContainer sandbox

The course MDX renderer SHALL support a `WebContainerSandbox` block that boots a WebContainer runtime in the student's browser, mounts a virtual file system from the block's `files` prop, installs dependencies, and runs a test command to determine pass/fail. The system SHALL NOT execute student code on any server; all execution SHALL happen client-side inside the WebContainer sandbox.

#### Scenario: Student runs code and the test suite passes

- **WHEN** a student clicks "Run" inside a `WebContainerSandbox` block and the configured test command exits with code 0
- **THEN** the system SHALL emit a `pass` result, hold for a 150ms hit-stop pause, then render the reward feedback (visual + audio) before revealing the next unlocked content

#### Scenario: Student runs code and the test suite fails

- **WHEN** a student clicks "Run" inside a `WebContainerSandbox` block and the configured test command exits with a non-zero code
- **THEN** the system SHALL emit a `fail` result and render a narrative hint derived from the test output instead of the raw stack trace, and SHALL NOT unlock subsequent content

##### Example: Known failure category maps to a templated hint

| Test output pattern | Rendered hint category |
| --- | --- |
| `SyntaxError` | 語法錯誤提示 |
| assertion failure (`AssertionError`, `expect(...).toBe`) | 測試斷言失敗提示 |
| execution exceeds configured timeout | 執行逾時提示 |
| none of the above match | 通用鼓勵文字（fallback） |

#### Scenario: Browser does not support WebContainer

- **WHEN** `window.crossOriginIsolated` is falsy when a `WebContainerSandbox` block mounts
- **THEN** the system SHALL render an explicit "此瀏覽器不支援程式碼沙盒" message and SHALL NOT attempt to boot the WebContainer runtime or silently degrade to a different sandbox type


<!-- @trace
source: course-studio-upgrade
updated: 2026-08-23
code:
  - packages/course/index.ts
  - packages/course/src/components/interactive/index.ts
  - docs/assets/course-engine/genre_simulation_lab_1787451430314.jpg
  - docs/assets/course-engine/negotiation_roleplay_sandbox_1787451270712.jpg
  - packages/course/src/components/interactive/WebContainerSandbox.tsx
  - docs/assets/course-engine/teacher_ai_curriculum_1787451125134.jpg
  - docs/assets/course-engine/course_mod_map_editor_1787451707912.jpg
  - packages/course/package.json
  - packages/course/src/mdx/block-registry.ts
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - docs/assets/course-engine/student_game_sandbox_1787451061663.jpg
  - packages/course/src/mdx/allowed-components.ts
  - docs/assets/course-engine/octalysis_gamification_ui_1787451993600.jpg
  - docs/assets/course-engine/music_interactive_classroom_1787451251703.jpg
  - packages/course/src/mdx/inspect-mdx-source.ts
  - docs/assets/course-engine/ai_anime_dynamic_render_1787451690674.jpg
  - packages/course/src/mdx/LessonMdx.tsx
  - apps/saas/next.config.ts
  - docs/assets/course-engine/teacher_block_studio_1787451106228.jpg
  - docs/startkiter-course-engine-research.md
  - docs/course-engine-architecture-gameplay-spec.md
  - apps/saas/modules/shared/components/CourseStudioContentPreview.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/reorder-lessons.ts
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/course-engine/genre_visual_novel_1787451409914.jpg
  - docs/assets/course-engine/student_hint_ladder_1787451091148.jpg
  - packages/course/src/webcontainer/sandbox-runtime.ts
  - docs/assets/course-engine/student_pass_celebration_1787451076193.jpg
  - docs/course-engine-experiential-layer-research.md
  - docs/startkiter-course-engine-visual-report-v2.html
  - apps/saas/app/api/course/studio/route.ts
  - docs/assets/course-engine-v2/open-world-course-engine.png
tests:
  - packages/course/src/mdx/LessonMdx.test.tsx
  - apps/saas/modules/shared/components/CourseStudioContentPreview.test.tsx
  - packages/course/src/components/interactive/WebContainerSandbox.test.tsx
  - apps/saas/app/api/course/studio/route.test.ts
  - packages/course/src/mdx/inspect-mdx-source.test.ts
  - packages/course/src/webcontainer/sandbox-runtime.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/reorder-lessons.test.ts
  - packages/course/src/mdx/block-registry.test.ts
-->

---
### Requirement: WebContainerSandbox props are validated as JSON-literal MDX attributes

The `WebContainerSandbox` block's props (`blockId`, `files`, `testCommand`, `hints`, `milestone`) SHALL be declared in MDX as JSON-literal attribute values only. The existing MDX safety inspector SHALL continue to reject any JavaScript expression, event handler, or dynamic value in these attributes.

#### Scenario: Operator saves a WebContainerSandbox block with a JS expression prop

- **WHEN** an operator saves Lesson content containing `<WebContainerSandbox files={someVariable} />` where `someVariable` is a JavaScript identifier rather than a JSON literal
- **THEN** the system SHALL reject the save with the existing "講義內容不允許 JavaScript 表達式" error, before any database write occurs

#### Scenario: Operator saves a valid WebContainerSandbox block

- **WHEN** an operator saves Lesson content containing `<WebContainerSandbox files={{"index.js": "console.log(1)"}} testCommand="npm test" hints={["先檢查函式名稱"]} />`
- **THEN** the system SHALL accept the save because all attribute values parse as JSON literals

<!-- @trace
source: course-studio-upgrade
updated: 2026-08-23
code:
  - packages/course/index.ts
  - packages/course/src/components/interactive/index.ts
  - docs/assets/course-engine/genre_simulation_lab_1787451430314.jpg
  - docs/assets/course-engine/negotiation_roleplay_sandbox_1787451270712.jpg
  - packages/course/src/components/interactive/WebContainerSandbox.tsx
  - docs/assets/course-engine/teacher_ai_curriculum_1787451125134.jpg
  - docs/assets/course-engine/course_mod_map_editor_1787451707912.jpg
  - packages/course/package.json
  - packages/course/src/mdx/block-registry.ts
  - docs/assets/course-engine-v2/learning-game-feel-case.png
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - docs/assets/course-engine/student_game_sandbox_1787451061663.jpg
  - packages/course/src/mdx/allowed-components.ts
  - docs/assets/course-engine/octalysis_gamification_ui_1787451993600.jpg
  - docs/assets/course-engine/music_interactive_classroom_1787451251703.jpg
  - packages/course/src/mdx/inspect-mdx-source.ts
  - docs/assets/course-engine/ai_anime_dynamic_render_1787451690674.jpg
  - packages/course/src/mdx/LessonMdx.tsx
  - apps/saas/next.config.ts
  - docs/assets/course-engine/teacher_block_studio_1787451106228.jpg
  - docs/startkiter-course-engine-research.md
  - docs/course-engine-architecture-gameplay-spec.md
  - apps/saas/modules/shared/components/CourseStudioContentPreview.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/reorder-lessons.ts
  - docs/assets/course-engine-v2/teacher-ai-co-creation.png
  - docs/assets/course-engine/genre_visual_novel_1787451409914.jpg
  - docs/assets/course-engine/student_hint_ladder_1787451091148.jpg
  - packages/course/src/webcontainer/sandbox-runtime.ts
  - docs/assets/course-engine/student_pass_celebration_1787451076193.jpg
  - docs/course-engine-experiential-layer-research.md
  - docs/startkiter-course-engine-visual-report-v2.html
  - apps/saas/app/api/course/studio/route.ts
  - docs/assets/course-engine-v2/open-world-course-engine.png
tests:
  - packages/course/src/mdx/LessonMdx.test.tsx
  - apps/saas/modules/shared/components/CourseStudioContentPreview.test.tsx
  - packages/course/src/components/interactive/WebContainerSandbox.test.tsx
  - apps/saas/app/api/course/studio/route.test.ts
  - packages/course/src/mdx/inspect-mdx-source.test.ts
  - packages/course/src/webcontainer/sandbox-runtime.test.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/reorder-lessons.test.ts
  - packages/course/src/mdx/block-registry.test.ts
-->