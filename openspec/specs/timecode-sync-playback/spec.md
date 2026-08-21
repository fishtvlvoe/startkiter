# timecode-sync-playback Specification

## Purpose

TBD - created by archiving change 'interactive-learning-system'. Update Purpose after archive.

## Requirements

### Requirement: 時間碼使用正規化秒數

時間碼輸入可以是 MM:SS 或非負整數秒，但在資料與 runtime 中必須正規化為非負整數秒。start 不能大於 end；時間碼不得為負數、不可解析、超出已知 duration 或落在不存在的 lesson block。

#### Scenario: 合法時間碼被正規化

- **WHEN** MDX block 指定 01:30
- **THEN** parser 必須把它正規化為 90 秒，供 player adapter 與 block engine 共用

#### Scenario: 非法時間碼阻止發布

- **WHEN** operator 儲存 start 大於 end、負數或超出已知 duration 的時間碼
- **THEN** Studio 必須顯示驗證錯誤，且 lesson 不得發布

##### Example: 相同輸入得到相同秒數

- 01:30 與數字 90 都輸入至同一個 TimelineSync block
- 兩種輸入都正規化為 90
- active block 與 seek 行為完全一致


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
### Requirement: 播放器與課程內容可雙向時間碼同步

Fluent Player Shell 的 provider adapter 必須發出目前播放秒數，讓 TimelineSync 在有效區間高亮；使用者點擊合法時間碼時，adapter 必須 seek 至正規化秒數。auto-scroll 不得搶走 keyboard focus，並須尊重 reduced-motion 偏好。這項契約必須以真實 player current-time event 驗證，不得只測試獨立 hook。

#### Scenario: 播放進度啟用對應積木

- **WHEN** player adapter 送出 90 秒 current-time event，且某 TimelineSync block 範圍涵蓋 90 秒
- **THEN** 對應 block 必須成為 active，並依使用者 motion 偏好決定是否平滑捲動

#### Scenario: 點擊時間碼讓播放器 seek

- **WHEN** 學員點擊正規化為 90 秒的時間碼 control
- **THEN** provider adapter 必須收到 seek 90 秒指令，且目前播放／block active state 同步更新

##### Example: reduced-motion 不失去學習同步

- 使用者啟用 reduced motion
- player 進入對應時間碼範圍時 block 仍被標示為 active
- UI 不自動平滑捲動，也不奪走目前 keyboard focus

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