# interactive-learning-blocks Specification

## Purpose

TBD - created by archiving change 'interactive-learning-system'. Update Purpose after archive.

## Requirements

### Requirement: MDX 課程內容只允許固定互動積木

課程 MDX renderer 必須只允許透過 Block Schema Registry 動態註冊的積木；registry 目前收錄 TimelineSync、ConceptCompare、MicroSandbox、WorkflowSorter、InstantQuiz、TeacherAvatar、DialogueWindow、WebContainerSandbox 八個積木。每個積木 props 必須先通過其在 registry 中宣告的 Zod schema 驗證；renderer 不得執行 raw HTML、script、event handler、未註冊 JSX component 或遠端 import。新增積木必須透過在 registry 加入一筆定義完成，`allowed-components.ts` 導出的名稱集合與 `LessonMdx.tsx` 的 component map 必須由 registry 動態衍生，不得手動維護獨立清單。

#### Scenario: 合法的 InstantQuiz 被安全渲染

- **WHEN** 已發布 lesson 的 MDX 包含合法 InstantQuiz props
- **THEN** renderer 必須渲染 registry 中登記的積木，並保留其可存取題目、選項與回饋結構

##### Example: 已發布單元安全呈現測驗

- lesson-03 的 MDX 只含已註冊 InstantQuiz 與合法 question、options、answerIndex
- 有權學員開啟 lesson-03 時看到題目與可用鍵盤選擇的選項
- renderer 不執行 lesson 內容以外的 HTML 或 script

#### Scenario: 未在 registry 中的 component 被拒絕

- **WHEN** operator 儲存含 registry 未收錄 component 名稱或 raw script 的 MDX
- **THEN** Studio 必須回傳驗證錯誤，不能發布或在學員端渲染該內容

##### Example: registry 收錄的積木可逐一測試

- 測試依序提供 registry 目前收錄的每個積木的最小合法 props
- 每個都可渲染或驗證成功
- 任何一個不在 registry 中的名稱都被拒絕


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
### Requirement: 互動積木完成事件受伺服器驗證

互動積木的完成事件必須帶有 server 可驗證的 lesson id 與 allowlisted block id。server 必須從 session 推導 user，確認該 user 有權讀取 lesson 後才可寫入 progress；client 不能以任意 userId、草稿 lesson id 或偽造 block id 寫入資料。

#### Scenario: 學員完成合法 block

- **WHEN** 有權學員完成 lesson-03 中已註冊的 quiz-01
- **THEN** server 必須只為該學員記錄一次完成事件，並回傳更新後的自身進度

#### Scenario: client 偽造其他使用者進度

- **WHEN** user A 在完成事件 payload 填入 user B 的 id
- **THEN** server 必須忽略 client user id、只以 user A session 判定，或拒絕格式不合法請求；user B 資料不得改變

##### Example: 重複事件 idempotent

- user A 對同一 lesson-03／quiz-01 送出兩次完成事件
- 持久化資料只有一個對應完成紀錄
- 聚合進度不會因第二次請求增加


<!-- @trace
source: interactive-learning-system
updated: 2026-08-21
code:
  - docs/startkiter-development-sop.md
  - packages/support/index.ts
  - docs/tutorials/puter-serverless-mvp/presentation-kimi-prompt.md
  - docs/dispatch-board.md
  - config/modules.ts
  - docs/discuss/2026-08-17-supastarter-gap-risk-report.md
  - packages/api/modules/deployment/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/tsconfig.json
  - packages/api/index.ts
  - packages/platform/src/deployment/coolify-client.ts
  - packages/platform/src/deployment/status.ts
  - packages/support/src/chatwoot-signature.ts
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - apps/saas/modules/deployment/components/ReportIssueButton.tsx
  - packages/course/package.json
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/marketing/modules/course/components/CourseBuyCta.tsx
  - packages/database/prisma/seed-course.ts
  - packages/support/src/copilot.ts
  - packages/course/index.ts
  - apps/saas/modules/shared/components/UserMenu.tsx
  - docs/demo/course-demo-2-manual.html
  - apps/saas/vitest.config.ts
  - docs/coolify-vps-setup-runbook.md
  - docs/discuss/2026-08-17-supastarter-source-correction.md
  - packages/course/src/mdx/LessonMdx.tsx
  - packages/api/package.json
  - packages/database/package.json
  - apps/saas/AGENTS.md
  - apps/marketing/modules/course/lib/public-curriculum.ts
  - packages/platform/src/deployment/credentials.ts
  - docs/discuss/2026-08-17-landing-signup-visual-feedback.md
  - packages/platform/src/deployment/types.ts
  - packages/platform/vitest.config.ts
  - apps/saas/app/api/course/studio/route.ts
  - packages/platform/src/mount-points.ts
  - packages/course/src/config/modules.ts
  - packages/github-kit/index.ts
  - packages/github-kit/provision-buyer-repo.ts
  - packages/api/modules/course/router.ts
  - apps/saas/package.json
  - apps/marketing/app/[locale]/course/preview/[lessonId]/page.tsx
  - docs/gaishen-workflow-demo.html
  - apps/saas/modules/deployment/constants.ts
  - packages/api/modules/deployment/procedures/provision-server.ts
  - packages/platform/tsconfig.json
  - docs/demo/course-sales-page-powercourse.html
  - packages/github-kit/repo-version.ts
  - packages/github-kit/types.ts
  - docs/tutorials/puter-serverless-mvp/README.md
  - docs/为什么叫QQ – 你的AI编程总是翻车？因为你少做了一步：设计隔离  拆解 Grill-me，Superpowers，Openspec 的第一步.md
  - packages/github-kit/revoke.ts
  - packages/support/src/chatwoot-payload.ts
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - docs/discuss/2026-08-21-thetu-core-modules-architecture.html
  - README.md
  - docs/gaishen-orca-workflow.md
  - packages/support/src/ticket-status.ts
  - apps/saas/lib/operator.ts
  - packages/api/modules/support/lib/chatwoot-client.ts
  - packages/course/src/components/interactive/WorkflowSorter.tsx
  - packages/course/src/mdx/extract-lesson-block-ids.ts
  - packages/support/package.json
  - docs/discuss/2026-08-17-wp-frontend-mount-research.md
  - packages/support/src/generate-diagnosis.ts
  - apps/saas/app/api/mcp/lib/config.ts
  - packages/api/modules/support/procedures/chatwoot-webhook.ts
  - .spectra.yaml
  - packages/github-kit/github-app-client.ts
  - apps/saas/modules/deployment/components/ManagedVpsGuide.tsx
  - packages/course/src/components/interactive/MicroSandbox.tsx
  - packages/platform/package.json
  - packages/api/modules/support/router.ts
  - apps/saas/app/api/mcp/connections/[id]/route.ts
  - packages/support/vitest.config.ts
  - apps/saas/app/api/mcp/connections/route.ts
  - apps/saas/app/api/mcp/lib/handler.ts
  - packages/course/src/components/interactive/TimelineSync.tsx
  - packages/database/prisma/migrations/20260819120000_add_studio_folder_collapse_state/migration.sql
  - apps/saas/app/api/repo-version/route.ts
  - docs/demo/course-frontend-landing-demo.html
  - packages/platform/src/deployment/db.ts
  - apps/saas/app/api/github/claim/route.ts
  - AGENTS.md
  - apps/saas/app/api/mcp/lib/guard.ts
  - apps/saas/app/api/course/ai/route.ts
  - apps/saas/CLAUDE.md
  - packages/platform/src/deployment/fleet.ts
  - packages/platform/src/deployment/tiers.ts
  - packages/course/src/components/interactive/DialogueWindow.tsx
  - packages/github-kit/config.ts
  - docs/demo/course-admin-studio-demo.html
  - packages/course/src/components/interactive/ConceptCompare.tsx
  - packages/database/prisma/zod/index.ts
  - docs/dispatch-board.html
  - docs/deploy-and-public-url.md
  - packages/course/src/player/FluentPlayer.tsx
  - docs/demo/course-demo-3-supastarter-ai.html
  - apps/saas/modules/deployment/components/DeploymentStatusPanel.tsx
  - packages/course/src/components/interactive/InstantQuiz.tsx
  - apps/saas/lib/github-kit.ts
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - packages/course/vitest.config.ts
  - packages/platform/src/types.ts
  - apps/marketing/modules/course/lib/duration.ts
  - docs/tutorials/puter-serverless-mvp/demo/index.html
  - packages/course/src/components/interactive/TeacherAvatar.tsx
  - packages/api/orpc/router.ts
  - packages/course/src/hooks/use-time-sync.ts
  - docs/demo/course-demo-1-split.html
  - packages/api/modules/deployment/procedures/get-status.ts
  - docs/demo/StartKiter-成果儀表板.html
  - packages/database/prisma/schema.prisma
  - apps/saas/modules/deployment/components/TierSelector.tsx
  - packages/course/src/mdx/allowed-components.ts
  - packages/database/prisma/index.ts
  - packages/platform/index.ts
  - docs/demo/course-demo-3-workspace.html
  - docs/demo/buyer-status-panel-demo.html
  - packages/database/prisma/migrations/20260820032747_add_plugin_content/migration.sql
  - docs/startkiter開發討論.md
  - packages/database/prisma/migrations/20260820033416_add_mcp_connection/migration.sql
  - packages/api/modules/course/lib/video-resolver.ts
  - packages/course/tsconfig.json
  - apps/saas/app/api/mcp/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx
  - docs/discuss/2026-08-17-hyperagent-reference.md
  - apps/marketing/app/[locale]/course/page.tsx
  - packages/support/tsconfig.json
  - packages/api/modules/deployment/procedures/submit-credential.ts
  - packages/course/src/components/interactive/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - apps/saas/app/(authenticated)/ChatwootScript.tsx
  - packages/course/src/mdx/inspect-mdx-source.ts
  - apps/saas/app/(authenticated)/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/deployment/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/orpc/procedures.ts
  - docs/demo/puter-todo-app.html
  - packages/github-kit/claim.ts
tests:
  - packages/api/modules/course/toggle-lesson-progress.test.ts
  - packages/database/src/plugin-content/plugin-content.test.ts
  - packages/platform/src/types.test.ts
  - packages/support/src/copilot.test.ts
  - packages/api/modules/course/course.test.ts
  - apps/saas/modules/deployment/deployment-status.test.ts
  - packages/platform/src/deployment/tiers.test.ts
  - packages/api/modules/support/procedures/chatwoot-webhook.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/platform/src/deployment/fleet.test.ts
  - packages/platform/src/deployment/status.test.ts
  - packages/course/src/mdx/extract-lesson-block-ids.test.ts
  - packages/platform/src/deployment/coolify-client.test.ts
  - apps/saas/modules/deployment/chatwoot-script.test.ts
  - packages/support/src/chatwoot-signature.test.ts
  - apps/marketing/modules/course/lib/duration.test.ts
  - packages/api/modules/deployment/procedures/deployment-procedures.test.ts
  - packages/support/src/ticket-status.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/course/src/config/modules.test.ts
  - packages/course/src/components/interactive/interactive.test.tsx
  - packages/github-kit/config.test.ts
  - packages/github-kit/claim.test.ts
  - apps/saas/modules/deployment/report-issue-button.test.tsx
  - packages/database/src/support/ticket.test.ts
  - packages/platform/src/deployment/credentials.test.ts
  - packages/github-kit/repo-version.test.ts
  - packages/platform/src/mount-points.test.ts
  - packages/course/src/mdx/inspect-mdx-source.test.ts
  - apps/saas/app/api/mcp/route.test.ts
  - packages/github-kit/revoke.test.ts
-->

---
### Requirement: 隨堂測驗提供立即且可存取的回饋

InstantQuiz 必須在使用者選擇後提供立即的正確或錯誤文字回饋、解析與可存取狀態，不以 Emoji 或僅靠顏色表意。完成狀態只能在題目被有效回答後送出，並遵守 server 驗證與 idempotence。

#### Scenario: 選錯後仍可理解結果

- **WHEN** 學員選擇錯誤選項
- **THEN** 元件必須顯示文字化錯誤提示與解析，讓鍵盤與螢幕閱讀器使用者也能取得結果

##### Example: 選對後觸發一次完成事件

- 學員選擇正確答案
- 元件顯示文字化正確提示與解析
- 完成事件只送出一次，即使使用者重複點選同一答案

<!-- @trace
source: interactive-learning-system
updated: 2026-08-21
code:
  - docs/startkiter-development-sop.md
  - packages/support/index.ts
  - docs/tutorials/puter-serverless-mvp/presentation-kimi-prompt.md
  - docs/dispatch-board.md
  - config/modules.ts
  - docs/discuss/2026-08-17-supastarter-gap-risk-report.md
  - packages/api/modules/deployment/router.ts
  - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - apps/saas/tsconfig.json
  - packages/api/index.ts
  - packages/platform/src/deployment/coolify-client.ts
  - packages/platform/src/deployment/status.ts
  - packages/support/src/chatwoot-signature.ts
  - apps/saas/modules/shared/components/AuthWrapper.tsx
  - apps/saas/modules/deployment/components/ReportIssueButton.tsx
  - packages/course/package.json
  - apps/saas/modules/shared/components/NavBar.tsx
  - apps/marketing/modules/course/components/CourseBuyCta.tsx
  - packages/database/prisma/seed-course.ts
  - packages/support/src/copilot.ts
  - packages/course/index.ts
  - apps/saas/modules/shared/components/UserMenu.tsx
  - docs/demo/course-demo-2-manual.html
  - apps/saas/vitest.config.ts
  - docs/coolify-vps-setup-runbook.md
  - docs/discuss/2026-08-17-supastarter-source-correction.md
  - packages/course/src/mdx/LessonMdx.tsx
  - packages/api/package.json
  - packages/database/package.json
  - apps/saas/AGENTS.md
  - apps/marketing/modules/course/lib/public-curriculum.ts
  - packages/platform/src/deployment/credentials.ts
  - docs/discuss/2026-08-17-landing-signup-visual-feedback.md
  - packages/platform/src/deployment/types.ts
  - packages/platform/vitest.config.ts
  - apps/saas/app/api/course/studio/route.ts
  - packages/platform/src/mount-points.ts
  - packages/course/src/config/modules.ts
  - packages/github-kit/index.ts
  - packages/github-kit/provision-buyer-repo.ts
  - packages/api/modules/course/router.ts
  - apps/saas/package.json
  - apps/marketing/app/[locale]/course/preview/[lessonId]/page.tsx
  - docs/gaishen-workflow-demo.html
  - apps/saas/modules/deployment/constants.ts
  - packages/api/modules/deployment/procedures/provision-server.ts
  - packages/platform/tsconfig.json
  - docs/demo/course-sales-page-powercourse.html
  - packages/github-kit/repo-version.ts
  - packages/github-kit/types.ts
  - docs/tutorials/puter-serverless-mvp/README.md
  - docs/为什么叫QQ – 你的AI编程总是翻车？因为你少做了一步：设计隔离  拆解 Grill-me，Superpowers，Openspec 的第一步.md
  - packages/github-kit/revoke.ts
  - packages/support/src/chatwoot-payload.ts
  - docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md
  - docs/discuss/2026-08-21-thetu-core-modules-architecture.html
  - README.md
  - docs/gaishen-orca-workflow.md
  - packages/support/src/ticket-status.ts
  - apps/saas/lib/operator.ts
  - packages/api/modules/support/lib/chatwoot-client.ts
  - packages/course/src/components/interactive/WorkflowSorter.tsx
  - packages/course/src/mdx/extract-lesson-block-ids.ts
  - packages/support/package.json
  - docs/discuss/2026-08-17-wp-frontend-mount-research.md
  - packages/support/src/generate-diagnosis.ts
  - apps/saas/app/api/mcp/lib/config.ts
  - packages/api/modules/support/procedures/chatwoot-webhook.ts
  - .spectra.yaml
  - packages/github-kit/github-app-client.ts
  - apps/saas/modules/deployment/components/ManagedVpsGuide.tsx
  - packages/course/src/components/interactive/MicroSandbox.tsx
  - packages/platform/package.json
  - packages/api/modules/support/router.ts
  - apps/saas/app/api/mcp/connections/[id]/route.ts
  - packages/support/vitest.config.ts
  - apps/saas/app/api/mcp/connections/route.ts
  - apps/saas/app/api/mcp/lib/handler.ts
  - packages/course/src/components/interactive/TimelineSync.tsx
  - packages/database/prisma/migrations/20260819120000_add_studio_folder_collapse_state/migration.sql
  - apps/saas/app/api/repo-version/route.ts
  - docs/demo/course-frontend-landing-demo.html
  - packages/platform/src/deployment/db.ts
  - apps/saas/app/api/github/claim/route.ts
  - AGENTS.md
  - apps/saas/app/api/mcp/lib/guard.ts
  - apps/saas/app/api/course/ai/route.ts
  - apps/saas/CLAUDE.md
  - packages/platform/src/deployment/fleet.ts
  - packages/platform/src/deployment/tiers.ts
  - packages/course/src/components/interactive/DialogueWindow.tsx
  - packages/github-kit/config.ts
  - docs/demo/course-admin-studio-demo.html
  - packages/course/src/components/interactive/ConceptCompare.tsx
  - packages/database/prisma/zod/index.ts
  - docs/dispatch-board.html
  - docs/deploy-and-public-url.md
  - packages/course/src/player/FluentPlayer.tsx
  - docs/demo/course-demo-3-supastarter-ai.html
  - apps/saas/modules/deployment/components/DeploymentStatusPanel.tsx
  - packages/course/src/components/interactive/InstantQuiz.tsx
  - apps/saas/lib/github-kit.ts
  - apps/saas/modules/shared/lib/nav-menu-items.ts
  - packages/course/vitest.config.ts
  - packages/platform/src/types.ts
  - apps/marketing/modules/course/lib/duration.ts
  - docs/tutorials/puter-serverless-mvp/demo/index.html
  - packages/course/src/components/interactive/TeacherAvatar.tsx
  - packages/api/orpc/router.ts
  - packages/course/src/hooks/use-time-sync.ts
  - docs/demo/course-demo-1-split.html
  - packages/api/modules/deployment/procedures/get-status.ts
  - docs/demo/StartKiter-成果儀表板.html
  - packages/database/prisma/schema.prisma
  - apps/saas/modules/deployment/components/TierSelector.tsx
  - packages/course/src/mdx/allowed-components.ts
  - packages/database/prisma/index.ts
  - packages/platform/index.ts
  - docs/demo/course-demo-3-workspace.html
  - docs/demo/buyer-status-panel-demo.html
  - packages/database/prisma/migrations/20260820032747_add_plugin_content/migration.sql
  - docs/startkiter開發討論.md
  - packages/database/prisma/migrations/20260820033416_add_mcp_connection/migration.sql
  - packages/api/modules/course/lib/video-resolver.ts
  - packages/course/tsconfig.json
  - apps/saas/app/api/mcp/route.ts
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx
  - docs/discuss/2026-08-17-hyperagent-reference.md
  - apps/marketing/app/[locale]/course/page.tsx
  - packages/support/tsconfig.json
  - packages/api/modules/deployment/procedures/submit-credential.ts
  - packages/course/src/components/interactive/index.ts
  - packages/database/prisma/migrations/migration_lock.toml
  - apps/saas/app/(authenticated)/ChatwootScript.tsx
  - packages/course/src/mdx/inspect-mdx-source.ts
  - apps/saas/app/(authenticated)/layout.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/deployment/page.tsx
  - apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx
  - packages/api/orpc/procedures.ts
  - docs/demo/puter-todo-app.html
  - packages/github-kit/claim.ts
tests:
  - packages/api/modules/course/toggle-lesson-progress.test.ts
  - packages/database/src/plugin-content/plugin-content.test.ts
  - packages/platform/src/types.test.ts
  - packages/support/src/copilot.test.ts
  - packages/api/modules/course/course.test.ts
  - apps/saas/modules/deployment/deployment-status.test.ts
  - packages/platform/src/deployment/tiers.test.ts
  - packages/api/modules/support/procedures/chatwoot-webhook.test.ts
  - apps/saas/modules/shared/lib/nav-menu-items.test.ts
  - packages/platform/src/deployment/fleet.test.ts
  - packages/platform/src/deployment/status.test.ts
  - packages/course/src/mdx/extract-lesson-block-ids.test.ts
  - packages/platform/src/deployment/coolify-client.test.ts
  - apps/saas/modules/deployment/chatwoot-script.test.ts
  - packages/support/src/chatwoot-signature.test.ts
  - apps/marketing/modules/course/lib/duration.test.ts
  - packages/api/modules/deployment/procedures/deployment-procedures.test.ts
  - packages/support/src/ticket-status.test.ts
  - apps/saas/modules/shared/components/NavBar.test.tsx
  - packages/course/src/config/modules.test.ts
  - packages/course/src/components/interactive/interactive.test.tsx
  - packages/github-kit/config.test.ts
  - packages/github-kit/claim.test.ts
  - apps/saas/modules/deployment/report-issue-button.test.tsx
  - packages/database/src/support/ticket.test.ts
  - packages/platform/src/deployment/credentials.test.ts
  - packages/github-kit/repo-version.test.ts
  - packages/platform/src/mount-points.test.ts
  - packages/course/src/mdx/inspect-mdx-source.test.ts
  - apps/saas/app/api/mcp/route.test.ts
  - packages/github-kit/revoke.test.ts
-->