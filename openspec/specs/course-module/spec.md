# course-module Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: Course is a module on the sellable site

StartKiter 必須以「電馭學院（StartKiter Academy）」提供站內課程模組，而不是導向第三方課程平台。課程模組必須同時在 `schema.prisma`、`packages/api/modules/course/`、`apps/saas/app/.../course/` 與 `config/modules.ts` 有可追蹤的 `course` module id；`config/modules.ts` 是名稱、SVG icon key、導航群組、順序與 enabled 狀態的唯一註冊來源。

#### Scenario: 付費學員在站內進入電馭學院

- **WHEN** 擁有 `startkiter-mvp` 已付款訂單且 `courseAccess=true` 的學員開啟已發布單元
- **THEN** 系統必須在 StartKiter 站內的電馭學院教室播放，且不得要求啟動第三方課程平台

##### Example: 同一 module id 可跨四個 Mount Point 追蹤

- `config/modules.ts` 宣告 `id="course"` 與電馭學院的 SVG icon key
- Prisma migration、course oRPC router、學員頁與 Studio 頁都使用相同 `course` module id
- 測試找不到任一 Mount Point 或找到第二份 enabled 真相時失敗


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
### Requirement: Lesson list is bounded

packages/course SHALL expose a finite lesson list. An empty or whitespace-only lesson id MUST be rejected as invalid before any catalog lookup or entitlement check.

#### Scenario: Empty lesson id

- **WHEN** a client requests lesson playback or lookup with an empty or whitespace-only lesson id
- **THEN** the response MUST be HTTP 400

##### Example: 空白單元 id 遭拒

- 已登入且已付款用戶請求 lessonId=""（或全空白字串）
- 回應 HTTP 400，未進入 courseAccess 或 catalog 查找


<!-- @trace
source: extract-course-module
updated: 2026-08-15
code:
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/next.config.ts
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/i18n/tsconfig.json
  - packages/payments/src/memory-store.ts
  - packages/auth/package.json
  - apps/saas/app/api/payuni/notify/route.ts
  - docs/discuss/architecture-draft.md
  - docs/discuss/v1-boundary.md
  - apps/saas/app/api/course/lessons/route.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/course/src/playback.ts
  - packages/payments/src/constants.ts
  - apps/saas/app/checkout/page.tsx
  - apps/saas/.env.example
  - apps/saas/app/checkout/result/page.tsx
  - apps/saas/app/signup/page.tsx
  - packages/i18n/src/index.ts
  - packages/utils/tsconfig.json
  - packages/course/src/access.ts
  - tsconfig.json
  - packages/database/prisma/migrations/migration_lock.toml
  - apps/saas/tsconfig.json
  - apps/saas/next-env.d.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/package.json
  - package.json
  - packages/auth/src/providers.ts
  - packages/database/src/index.ts
  - apps/saas/app/checkout/checkout-button.tsx
  - docs/discuss/extract-map.md
  - packages/auth/src/index.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/utils/src/index.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/orders/refund/route.ts
  - apps/saas/app/page.tsx
  - packages/payments/src/index.ts
  - packages/payments/src/refund.ts
  - packages/course/tsconfig.json
  - packages/payments/package.json
  - packages/course/src/index.ts
  - packages/payments/src/order.ts
  - docs/discuss/README.md
  - turbo.json
  - packages/payments/src/provider/payuni/gateway.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/login/page.tsx
  - packages/database/package.json
  - packages/database/prisma/schema.prisma
  - packages/auth/src/auth.ts
  - apps/saas/app/globals.css
  - vitest.config.ts
  - packages/utils/package.json
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - packages/payments/src/notify.ts
  - README.md
  - apps/saas/lib/orders.ts
  - tooling/typescript/package.json
  - pnpm-workspace.yaml
  - apps/saas/app/app/sign-out-button.tsx
  - packages/i18n/package.json
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/auth/src/test-auth.ts
  - packages/database/tsconfig.json
  - AGENTS.md
  - packages/auth/tsconfig.json
  - packages/course/package.json
  - apps/saas/app/api/demo/grant-course/route.ts
  - apps/saas/app/course/page.tsx
  - packages/course/src/catalog.ts
  - packages/ui/src/index.tsx
  - packages/payments/src/provider/payuni/crypto.ts
  - tooling/typescript/base.json
  - apps/saas/app/app/page.tsx
  - packages/ui/package.json
  - apps/saas/app/layout.tsx
  - apps/saas/lib/demo-grant.ts
  - docs/discuss/2026-08-14-alignment.md
  - packages/ui/tsconfig.json
  - apps/saas/lib/course-access.ts
tests:
  - packages/course/src/playback.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/order.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/course/src/catalog.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Playback entitlement reads Order.courseAccess

Lesson playback authorization SHALL require a Better Auth session whose user owns at least one Order with sku startkiter-mvp and courseAccess true. Client-supplied user ids MUST NOT grant access.

#### Scenario: Paid learner with courseAccess can open a lesson

- **WHEN** a signed-in user who has an Order with sku startkiter-mvp and courseAccess true requests an existing lesson
- **THEN** the server MUST allow playback and MUST return the lesson payload needed for in-site play

##### Example: 付費學員可播 lesson-01

- userId=user_paid 有 Order status=paid、courseAccess=true、sku=startkiter-mvp
- 請求 lessonId=lesson-01 成功，回應含該單元播放所需資料

#### Scenario: Unpaid or refunded learner is denied

- **WHEN** a signed-in user with no Order.courseAccess true for sku startkiter-mvp requests lesson playback
- **THEN** the response MUST be HTTP 403 and MUST NOT include the lesson media body or media URL

##### Example: 退款後再播遭拒

- userId=user_refunded 的 Order status=refunded、courseAccess=false
- 請求 lessonId=lesson-01 回 HTTP 403，且回應不含媒體 URL

#### Scenario: Unauthenticated playback is rejected

- **WHEN** a request without a valid session asks for lesson playback
- **THEN** the server MUST deny the request (HTTP 401 or redirect to sign-in) and MUST NOT stream the lesson body


<!-- @trace
source: extract-course-module
updated: 2026-08-15
code:
  - packages/database/prisma/migrations/20260814160938_init/migration.sql
  - apps/saas/app/course/demo-grant-button.tsx
  - apps/saas/next.config.ts
  - docs/discuss/2026-08-14-thetu-source.md
  - packages/i18n/tsconfig.json
  - packages/payments/src/memory-store.ts
  - packages/auth/package.json
  - apps/saas/app/api/payuni/notify/route.ts
  - docs/discuss/architecture-draft.md
  - docs/discuss/v1-boundary.md
  - apps/saas/app/api/course/lessons/route.ts
  - apps/saas/app/checkout/payuni/page.tsx
  - packages/course/src/playback.ts
  - packages/payments/src/constants.ts
  - apps/saas/app/checkout/page.tsx
  - apps/saas/.env.example
  - apps/saas/app/checkout/result/page.tsx
  - apps/saas/app/signup/page.tsx
  - packages/i18n/src/index.ts
  - packages/utils/tsconfig.json
  - packages/course/src/access.ts
  - tsconfig.json
  - packages/database/prisma/migrations/migration_lock.toml
  - apps/saas/tsconfig.json
  - apps/saas/next-env.d.ts
  - docs/discuss/payment-and-deploy.md
  - apps/saas/package.json
  - package.json
  - packages/auth/src/providers.ts
  - packages/database/src/index.ts
  - apps/saas/app/checkout/checkout-button.tsx
  - docs/discuss/extract-map.md
  - packages/auth/src/index.ts
  - packages/payments/src/checkout.ts
  - apps/saas/app/api/checkout/route.ts
  - packages/utils/src/index.ts
  - apps/saas/app/login/login-form.tsx
  - apps/saas/app/api/orders/refund/route.ts
  - apps/saas/app/page.tsx
  - packages/payments/src/index.ts
  - packages/payments/src/refund.ts
  - packages/course/tsconfig.json
  - packages/payments/package.json
  - packages/course/src/index.ts
  - packages/payments/src/order.ts
  - docs/discuss/README.md
  - turbo.json
  - packages/payments/src/provider/payuni/gateway.ts
  - apps/saas/app/course/[lessonId]/page.tsx
  - apps/saas/app/api/auth/[...all]/route.ts
  - packages/payments/src/factory.ts
  - packages/payments/src/credentials.ts
  - apps/saas/app/login/page.tsx
  - packages/database/package.json
  - packages/database/prisma/schema.prisma
  - packages/auth/src/auth.ts
  - apps/saas/app/globals.css
  - vitest.config.ts
  - packages/utils/package.json
  - apps/saas/app/not-found.tsx
  - apps/saas/app/api/payuni/return/route.ts
  - packages/payments/src/notify.ts
  - README.md
  - apps/saas/lib/orders.ts
  - tooling/typescript/package.json
  - pnpm-workspace.yaml
  - apps/saas/app/app/sign-out-button.tsx
  - packages/i18n/package.json
  - packages/database/prisma/migrations/20260815010000_add_order/migration.sql
  - packages/auth/src/test-auth.ts
  - packages/database/tsconfig.json
  - AGENTS.md
  - packages/auth/tsconfig.json
  - packages/course/package.json
  - apps/saas/app/api/demo/grant-course/route.ts
  - apps/saas/app/course/page.tsx
  - packages/course/src/catalog.ts
  - packages/ui/src/index.tsx
  - packages/payments/src/provider/payuni/crypto.ts
  - tooling/typescript/base.json
  - apps/saas/app/app/page.tsx
  - packages/ui/package.json
  - apps/saas/app/layout.tsx
  - apps/saas/lib/demo-grant.ts
  - docs/discuss/2026-08-14-alignment.md
  - packages/ui/tsconfig.json
  - apps/saas/lib/course-access.ts
tests:
  - packages/course/src/playback.test.ts
  - packages/payments/src/checkout.test.ts
  - packages/payments/src/refund.test.ts
  - packages/payments/src/notify.test.ts
  - packages/payments/src/session-failclosed.test.ts
  - packages/payments/src/order.test.ts
  - packages/course/src/access.test.ts
  - packages/payments/src/crypto.test.ts
  - packages/payments/src/credentials.test.ts
  - packages/payments/src/factory.test.ts
  - packages/course/src/catalog.test.ts
  - packages/auth/src/auth.test.ts
-->

---
### Requirement: Lesson catalog is served from the course package

`packages/course` 必須提供由已發布 Course、Chapter、Lesson 組成的確定排序課綱。公開 reader 只能輸出已發布資料；operator preview 可以讀 draft；任何 reader 都必須以 `position` 再以穩定 id 排序。

#### Scenario: 已發布課綱在公開頁與學員教室一致

- **WHEN** operator 發布一個含兩章、八個單元的 Course
- **THEN** 公開銷售頁和有權學員教室都必須以相同章節與單元順序顯示該已發布版本

##### Example: 草稿不外洩

- operator 建立尚未發布的 `lesson-draft-01`
- 匿名與一般學員查詢課綱時不會收到該 id、草稿內容、AI context 或影音 URL
- operator 使用 Studio preview 時才可讀到草稿


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
### Requirement: 電馭學院提供公開銷售、試看與學員教室三門戶

系統必須提供公開電馭學院銷售頁、已購買學員教室與 operator 專用 Course Studio 三個門戶。公開頁必須展示已發布的 Hero、課程亮點、講師／FAQ 內容、課綱、唯一 PAYUNi 結帳 CTA 與試看入口；價格與結帳行為必須讀取既有單一 SKU，不能另建 checkout。

#### Scenario: 匿名訪客只可試看標記單元

- **WHEN** 未登入訪客由公開銷售頁選擇 `isFreePreview=true` 的 `lesson-01`
- **THEN** 系統必須在 Fluent Player Shell 中提供該已發布試看內容，且不得輸出其他非試看單元的媒體或內容

##### Example: 鎖定單元不因公開課綱而解鎖

- 課綱顯示 `lesson-02` 但其 `isFreePreview=false`
- 匿名訪客開啟 `lesson-02` 時遭拒絕，回應不含可播放媒體 URL
- 已付款學員開啟同一單元時可進入學員教室


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
### Requirement: 學員進度由持久化單元完成狀態推導

系統必須以 `LessonProgress` 記錄目前使用者完成的已發布單元。頂部常駐進度列必須顯示 `round(100 * completed / total)` 與 `completed/total`，例如完成 3 個共 8 個已發布單元時顯示 `38% · 3/8 單元`。完成標記必須 idempotent，不能由 client 傳入百分比或其他 userId。

#### Scenario: 學員完成單元後立即看見一致進度

- **WHEN** 有課程權限的使用者將 `lesson-03` 標記完成
- **THEN** 系統必須持久化該使用者與該單元的完成狀態，立即更新頂部百分比、完成數和課綱中的綠色 SVG 勾選

##### Example: 重複完成不會重複計算

- user A 已完成 `lesson-01`、`lesson-02`、`lesson-03`，共 8 個已發布單元
- user A 再次送出 `lesson-03` 完成請求
- `LessonProgress(user A, lesson-03)` 仍只有一筆，畫面仍顯示 `38% · 3/8 單元`


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
### Requirement: 課綱側欄可收折且不破壞學習狀態

學員教室必須提供課綱側欄，顯示章節、單元編號、時長、目前播放中狀態和已完成單元的綠色 SVG 勾選。使用者可以一鍵收折或展開側欄；窄螢幕可以重排版面，但不可隱藏頂部進度資料。

#### Scenario: 收折側欄不切換或重置目前單元

- **WHEN** 學員正在播放 `lesson-03` 並收折、再展開課綱側欄
- **THEN** `lesson-03` 必須仍是目前單元，播放時間、完成狀態與進度數值不得改變

##### Example: 單元切換重新載入合法資料

- user A 從 `lesson-03` 點選 `lesson-04`
- 系統只讀取 user A 可播放的 `lesson-04` 已發布內容與 AI context
- 側欄指出 `lesson-04` 為目前單元，並保留 user A 原有完成勾選


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
### Requirement: Course Studio 僅供 operator 管理且變更可持久化

Course Studio 必須沿用既有 `ADMIN_EMAIL` operator 判定。operator 可以管理 Course、Chapter、Lesson、資料夾、模組排列、`isFreePreview`、發布狀態、allowlisted MDX、AI context 與影音設定；章節與單元必須支援確定排序與跨章節移動。所有 mutation 必須由伺服器 session 推導 actor，使用 transaction 保證排序完整性。

#### Scenario: 非 operator 無法讀寫 Studio 資料

- **WHEN** 未登入請求 Studio reader 或 mutation
- **THEN** 系統必須回 401，且不回傳 draft、影音 URL、AI context 或資料夾資料

#### Scenario: 已登入非 operator 無法讀寫 Studio 資料

- **WHEN** 一般已購買學員請求相同 Studio reader 或 mutation
- **THEN** 系統必須回 403，且不改變任何課綱、排序或發布狀態

##### Example: operator 跨章節拖曳後重新載入仍一致

- operator 把 `lesson-03` 從 `chapter-01` 拖到 `chapter-02` 的 position 1
- mutation 在單一 transaction 更新原章節與目標章節 position
- 重新載入 Studio、公開課綱與學員教室後，`lesson-03` 都只在 `chapter-02` position 1 出現一次


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
### Requirement: Studio 以 SVG icon-only action 提供編輯、預覽與刪除

Studio 的單元列必須以 imported SVG icon-only action 提供編輯、預覽與刪除語義。每個 action 必須有 `aria-label`、visible tooltip、keyboard focus 樣式；刪除前必須二次確認。不得以 Emoji、Unicode 圖像字元、Font Awesome font icon 或 `<i>` 標籤當作圖示。

#### Scenario: operator 刪除單元前必須確認

- **WHEN** operator 啟動某單元的刪除 action
- **THEN** 系統必須先顯示確認 dialog，只有確認後才呼叫刪除 mutation

##### Example: 取消刪除不改變公開課綱

- operator 開啟 `lesson-03` 的刪除 dialog 後取消
- `lesson-03` 仍在 Studio、公開已發布課綱與學員教室中存在


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
### Requirement: Studio 資料夾可折疊、改名與排序

operator 必須能管理 Studio 側欄資料夾：建立、改名、排序、將 module item 移至其他資料夾，以及為自己收折或展開資料夾。全站資料夾名稱與順序必須持久化；個人收折狀態不得改寫其他 operator 的偏好或 module descriptor。

#### Scenario: 資料夾改名與排序在重新載入後仍存在

- **WHEN** operator 將資料夾 `內容` 改名為 `課程內容` 並移至 position 1
- **THEN** 重新載入 Studio 後，所有 operator 都看到新名稱與順序，而各自的收折偏好仍保持各自狀態

##### Example: module item 保持單一註冊來源

- operator 將 `course` item 移入另一個 Studio 資料夾
- `config/modules.ts` 仍是 `course` 的 enabled、SVG icon key 與路由宣告來源
- 資料庫只保存資料夾與 item 排列，不複製第二份 module descriptor


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
### Requirement: 隨課 AI 助教只使用目前已授權單元內容

隨課文字 AI 助教必須由 server 派生目前使用者、目前 lesson id、已發布 lesson content 與該 lesson 的 AI context。它不得接受 client 指定其他 lesson 或 actor、不得註冊 tools、不得寫入進度或內容；provider 缺設定或輸入無效時必須 fail-closed。

#### Scenario: AI 助教拒絕跨單元內容

- **WHEN** 已付款學員在 `lesson-03` 的 AI 助教中要求讀取尚未發布的 `lesson-draft-01`
- **THEN** server 不得把草稿或其 AI context 傳給模型，回應只可基於 `lesson-03` 的已授權內容

##### Example: provider 未設定時不降級成未受限 chat

- AI provider 必要設定缺失
- 學員送出問題時收到白話的暫時不可用錯誤
- 系統不呼叫 site-agent tools，不寫入資料，也不回傳其他單元內容

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